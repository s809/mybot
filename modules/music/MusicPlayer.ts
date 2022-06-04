import { Readable } from "stream";
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { formatDuration } from "../../util";
import { AlwaysLastMessage, sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage";
import { Translator } from "../../modules/misc/Translator";
import { MessageEditOptions, GuildTextBasedChannel, VoiceBasedChannel, ChannelType } from "discord.js";
import { MusicPlayerQueue, MusicPlayerQueueEntry } from "./MusicPlayerQueue";
import { createDiscordJSAdapter } from "../../modules/music/voiceAdapter";
import { musicPlayingGuilds, voiceTimeouts } from "../../env";
import { setTimeout } from "timers/promises";
import { getDownloadStream } from "../../modules/music/youtubeDl";
import { makeOpusStream } from "../../modules/music/ffmpeg";
import { once } from "events";

export class MusicPlayer {
    /** Current voice connection. */
    private connection: VoiceConnection;
    /** Current voice channel. */
    private voiceChannel: VoiceBasedChannel;

    /** Current audio player. */
    private player: AudioPlayer;
    /** Current audio resource. */
    private resource: AudioResource;
    /** Underlying audio stream. */
    private readable: Readable;

    /** Queue object. */
    readonly queue: MusicPlayerQueue;
    /** Current entry. */
    private currentVideo: MusicPlayerQueueEntry;

    /** Status message. */
    private statusMessage: AlwaysLastMessage;
    /** Translator of this entry. */
    private translator: Translator;
    /** Custom text. */
    private text: string;

    constructor(voiceChannel: VoiceBasedChannel, initialEntries: MusicPlayerQueueEntry[], translator: Translator) {
        this.voiceChannel = voiceChannel;
        this.queue = new MusicPlayerQueue(initialEntries);
        this.queue.on("updateStatus", () => this.updateStatus());
        this.queue.on("error", () => this.stop())
        this.translator = translator;
    }

    /**
     * Updates status text with new text, if it's defined.
     */
    async updateStatus(text?: string | null) {
        switch (text) {
            case null:
                this.text = null;
                break;
            case undefined:
                break;
            default:
                this.text = text + "\n";
                break;
        }

        let currentTitleStr = this.currentVideo?.title ??
            this.translator.translate("embeds.music.loading");
        let currentDurationStr = this.currentVideo?.duration
            ? formatDuration(this.currentVideo.duration)
            : this.translator.translate("common.unknown");

        let queueData = this.queue.getQueueData(this.translator);
        let remainingToLoad = this.queue.entries.filter(entry => !entry.title).length;

        let options: MessageEditOptions = {
            embeds: [{
                title: this.text ?? this.translator.translate("embeds.music.title_player"),
                description: (this.currentVideo
                    ? this.translator.translate("embeds.music.now_playing", currentTitleStr, currentDurationStr)
                    : "")
                    + queueData.text || null,
                footer: {
                    text: this.queue.entries.length
                        ? this.translator.translate("embeds.music.queue_summary",
                            this.queue.entries.length.toString(),
                            queueData.formattedDuration)
                        + (remainingToLoad
                            ? this.translator.translate("embeds.music.load_remaining", remainingToLoad.toString())
                            : "")
                        + (this.queue.hadErrors
                            ? this.translator.translate("embeds.music.some_removed")
                            : "")
                        : null
                }
            }]
        };

        if (text !== undefined)
            await this.statusMessage.edit(options);
        else
            await this.statusMessage.editWithoutDeleting(options);
    }

    /**
     * Resumes player.
     * @returns Whether the resuming was successful.
     */
    async resume() {
        let resumed = this.player?.unpause() ?? false;
        if (resumed) {
            await this.updateStatus(null);
        }
        return resumed;
    }

    /**
     * Pauses player.
     * @returns Whether the pausing was successful.
     */
    async pause() {
        let paused = this.player?.pause() ?? false;
        if (paused) {
            await this.updateStatus(this.translator.translate("embeds.music.title_paused"));
        }
        return paused;
    }

    /**
     * Skips current.
     * @returns Whether the pausing was successful.
     */
    skip() {
        return this.player?.stop() ?? false;
    }

    /** Stops player. */
    stop() {
        if (!musicPlayingGuilds.has(this.voiceChannel.guild)) return;

        this.queue.splice(0, this.queue.entries.length);
        musicPlayingGuilds.delete(this.voiceChannel.guild);
        this.currentVideo = null;
        this.player?.stop();
        this.connection.destroy();
    }

    async runPlayer(statusChannel: GuildTextBasedChannel) {
        this.statusMessage = await sendAlwaysLastMessage(statusChannel, {
            embeds: [{
                title: this.translator.translate("embeds.music.title_player"),
                description: this.translator.translate("embeds.music.initializing")
            }]
        });

        this.connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guildId,
            selfMute: false,
            adapterCreator: createDiscordJSAdapter(this.voiceChannel)
        });;

        musicPlayingGuilds.set(this.voiceChannel.guild, this);

        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, voiceTimeouts.voiceReady);

            this.player = createAudioPlayer();
            this.player.on("error", () => { /* Ignored */ });
            this.connection.subscribe(this.player);

            while (this.queue.entries.length) {
                while (!this.queue.entries[0].title)
                    await setTimeout(1000);
                if (!this.queue.entries.length) return;
                this.currentVideo = this.queue.shift();

                try {
                    if (this.voiceChannel.type === ChannelType.GuildStageVoice)
                        await this.voiceChannel.guild.members.me.voice.setSuppressed(false);
                }
                catch (e) {
                    return this.translator.translate("errors.cannot_become_speaker");
                }
                await this.updateStatus(this.translator.translate("embeds.music.title_buffering"));

                let video = await getDownloadStream(this.currentVideo.url);
                let ffmpeg = await makeOpusStream(video);
                ffmpeg.on("close", () => video.destroy());

                this.readable = ffmpeg;
                this.resource = createAudioResource(this.readable);

                this.player.play(this.resource);
                await entersState(this.player, AudioPlayerStatus.Playing, voiceTimeouts.playerPlaying);

                await this.updateStatus(null);

                do {
                    if (this.player.state.status === AudioPlayerStatus.Paused) {
                        await Promise.any([
                            setTimeout(voiceTimeouts.paused),
                            once(this.player, "stateChange")
                        ]);
                        if (this.player.state.status === AudioPlayerStatus.Paused)
                            return;
                    }
                    await once(this.player, "stateChange");
                }
                while (![AudioPlayerStatus.Idle, AudioPlayerStatus.AutoPaused].includes(this.player.state.status));

                video.destroy();
                ffmpeg.destroy();

                switch (this.player.state.status) {
                    case AudioPlayerStatus.Idle:
                        await setTimeout(voiceTimeouts.playerIdle);
                        break;
                    case AudioPlayerStatus.AutoPaused:
                        return;
                }
            }
        } catch (e) {
            await statusChannel.send(e.stack);
        } finally {
            this.stop();
            await this.statusMessage.edit({
                embeds: [{
                    title: this.translator.translate("embeds.music.title_player"),
                    description: this.translator.translate("embeds.music.playback_finished")
                }]
            });
        }
    }
}
