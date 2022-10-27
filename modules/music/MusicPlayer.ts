import { Readable } from "stream";
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { formatDuration } from "../../util";
import { AlwaysLastMessage, sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage";
import { PrefixedTranslator, Translator } from "../../modules/misc/Translator";
import { MessageEditOptions, GuildTextBasedChannel, VoiceBasedChannel, ChannelType, LocaleString } from "discord.js";
import { MusicPlayerQueue, MusicPlayerQueueEntry } from "./MusicPlayerQueue";
import { createDiscordJSAdapter } from "../../modules/music/voiceAdapter";
import { voice } from "../../constants";
import { setTimeout } from "timers/promises";
import { getDownloadStream } from "../../modules/music/youtubeDl";
import { makeOpusStream } from "../../modules/music/ffmpeg";
import { once } from "events";
import { runtimeGuildData } from "../../env";

export class MusicPlayer {
    /** Current voice connection. */
    private connection!: VoiceConnection;
    /** Current voice channel. */
    private voiceChannel: VoiceBasedChannel;

    /** Current audio player. */
    private player: AudioPlayer | null = null;
    /** Current audio resource. */
    private resource: AudioResource | null = null;
    /** Underlying audio stream. */
    private readable: Readable | null = null;

    /** Queue object. */
    readonly queue: MusicPlayerQueue;
    /** Current entry. */
    private currentVideo: MusicPlayerQueueEntry | null = null;

    /** Status message. */
    private statusMessage!: AlwaysLastMessage;
    /** Translator of this entry. */
    private get translator() {
        if (!this._translator)
            throw new Error("Translator is not initialized.");
        return this._translator;
    }
    private _translator: PrefixedTranslator | null = null;
    private localeString: LocaleString;
    /** Custom text. */
    private text: string | null = null;

    constructor(voiceChannel: VoiceBasedChannel, initialEntries: MusicPlayerQueueEntry[], translator: Translator) {
        this.voiceChannel = voiceChannel;
        this.queue = new MusicPlayerQueue(initialEntries);
        this.queue.on("updateStatus", () => this.updateStatus());
        this.queue.on("error", () => this.stop())
        this.localeString = translator.localeString;
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
            this.translator.translate("strings.loading");
        let currentDurationStr = this.currentVideo?.duration
            ? formatDuration(this.currentVideo.duration)
            : this.translator.translate("strings.unknown");

        let queueData = this.queue.getQueueData(this.translator);
        let remainingToLoad = this.queue.entries.filter(entry => !entry.title).length;

        let options: MessageEditOptions = {
            embeds: [{
                title: this.text ?? this.translator.translate("embeds.title_player"),
                description: (this.currentVideo
                    ? this.translator.translate("embeds.now_playing", currentTitleStr, currentDurationStr) + "\n"
                    : "")
                    + queueData.text || undefined,
                footer: this.queue.entries.length
                    ? {
                        text: this.translator.translate("embeds.queue_summary",
                                this.queue.entries.length.toString(),
                                queueData.formattedDuration) + "\n"
                            + (remainingToLoad
                                ? this.translator.translate("embeds.load_remaining", remainingToLoad.toString()) + "\n"
                                : "")
                            + (this.queue.hadErrors
                                ? this.translator.translate("embeds.some_removed") + "\n"
                                : "")
                    }
                    : undefined
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
            await this.updateStatus(this.translator.translate("embeds.title_paused"));
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
        const guildData = runtimeGuildData.getOrSetDefault(this.voiceChannel.guildId);
        if (!guildData.musicPlayer) return;

        this.queue.splice(0, this.queue.entries.length);
        delete guildData.musicPlayer;
        this.currentVideo = null;
        this.player?.stop();
        this.connection.destroy();
    }

    async runPlayer(statusChannel: GuildTextBasedChannel) {
        this._translator = await Translator.getOrDefault(this.localeString, "music_player");

        this.statusMessage = await sendAlwaysLastMessage(statusChannel, {
            embeds: [{
                title: this.translator.translate("embeds.title_player"),
                description: this.translator.translate("embeds.initializing")
            }]
        });

        this.connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guildId,
            selfMute: false,
            adapterCreator: createDiscordJSAdapter(this.voiceChannel)
        });;

        runtimeGuildData.getOrSetDefault(this.voiceChannel.guildId).musicPlayer = this;

        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, voice.readyWaitTimeout);

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
                        await this.voiceChannel.guild.members.me!.voice.setSuppressed(false);
                }
                catch (e) {
                    return this.translator.translate("errors.cannot_become_speaker");
                }
                await this.updateStatus(this.translator.translate("embeds.title_buffering"));

                let video = await getDownloadStream(this.currentVideo.url);
                let ffmpeg = await makeOpusStream(video);
                ffmpeg.on("close", () => video.destroy());

                this.readable = ffmpeg;
                this.resource = createAudioResource(this.readable);

                this.player.play(this.resource);
                await entersState(this.player, AudioPlayerStatus.Playing, voice.playingWaitTimeout);

                await this.updateStatus(null);

                do {
                    if (this.player.state.status === AudioPlayerStatus.Paused) {
                        await Promise.any([
                            setTimeout(voice.pauseResumeTimeout),
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
                        await setTimeout(voice.nextTrackDelay);
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
                    title: this.translator.translate("embeds.title_player"),
                    description: this.translator.translate("embeds.playback_finished")
                }]
            });
        }
    }
}
