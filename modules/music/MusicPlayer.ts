import { Readable } from "stream";
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { formatDuration } from "../../util";
import { AlwaysLastMessage, sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage";
import { Translator } from "@s809/noisecord";
import { MessageEditOptions, GuildTextBasedChannel, VoiceBasedChannel, ChannelType, LocaleString } from "discord.js";
import { MusicPlayerQueue, MusicPlayerQueueEntry } from "./MusicPlayerQueue";
import { voice } from "../../constants";
import { setTimeout } from "timers/promises";
import { getDownloadStream } from "../../modules/music/youtubeDl";
import { once } from "events";
import { commandFramework, runtimeGuildData } from "../../env";

const stringLoc = commandFramework.translationChecker.checkTranslations({
    loading: true,
    unknown: true
}, "music_player.strings");

const embedLoc = commandFramework.translationChecker.checkTranslations({
    title_player: true,
    now_playing: true,
    queue_summary: true,
    load_remaining: true,
    some_removed: true,
    title_paused: true,
    initializing: true,
    title_buffering: true,
    playback_finished: true
}, "music_player.embeds");

const errorLoc = commandFramework.translationChecker.checkTranslations({
    cannot_become_speaker: true
}, "music_player.errors");

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
    private _translator: Translator | null = null;
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
            stringLoc.loading.getTranslation(this.translator);
        let currentDurationStr = this.currentVideo?.duration
            ? formatDuration(this.currentVideo.duration)
            : stringLoc.unknown.getTranslation(this.translator);

        let queueData = this.queue.getQueueData(this.translator);
        let remainingToLoad = this.queue.entries.filter(entry => !entry.title).length;

        let options: MessageEditOptions = {
            embeds: [{
                title: this.text ?? embedLoc.title_player.getTranslation(this.translator),
                description: (this.currentVideo
                    ? embedLoc.now_playing.getTranslation(this.translator, {
                        title: currentTitleStr,
                        duration: currentDurationStr
                    }) + "\n"
                    : "")
                    + queueData.text || undefined,
                footer: this.queue.entries.length
                    ? {
                        text: embedLoc.queue_summary.getTranslation(this.translator, {
                            length: this.queue.entries.length.toString(),
                            duration: queueData.formattedDuration
                        }) + "\n"
                            + (remainingToLoad
                                ? embedLoc.load_remaining.getTranslation(this.translator, { count: remainingToLoad }) + "\n"
                                : "")
                            + (this.queue.hadErrors
                                ? embedLoc.some_removed.getTranslation(this.translator) + "\n"
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
        if (resumed)
            await this.updateStatus(null);
        return resumed;
    }

    /**
     * Pauses player.
     * @returns Whether the pausing was successful.
     */
    async pause() {
        let paused = this.player?.pause() ?? false;
        if (paused)
            await this.updateStatus(embedLoc.title_paused.getTranslation(this.translator));
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
        const guildData = runtimeGuildData.get(this.voiceChannel.guildId);
        if (!guildData.musicPlayer) return;

        this.queue.splice(0, this.queue.entries.length);
        delete guildData.musicPlayer;
        this.currentVideo = null;
        this.player?.stop();
        this.connection.destroy();
    }

    async runPlayer(statusChannel: GuildTextBasedChannel) {
        this._translator = await commandFramework.translatorManager!.getTranslator(this.localeString, "music_player");

        this.statusMessage = await sendAlwaysLastMessage(statusChannel, {
            embeds: [{
                title: embedLoc.title_player.getTranslation(this.translator),
                description: embedLoc.initializing.getTranslation(this.translator)
            }]
        });

        this.connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guildId,
            selfMute: false,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator
        });;

        runtimeGuildData.get(this.voiceChannel.guildId).musicPlayer = this;

        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, voice.readyWaitTimeout);

            this.player = createAudioPlayer();
            this.player.on("error", e => { 
                if (e.message !== "Premature close")
                    throw e;
            });
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
                    return errorLoc.cannot_become_speaker.getTranslation(this.translator);
                }
                await this.updateStatus(embedLoc.title_buffering.getTranslation(this.translator));

                this.readable = await getDownloadStream(this.currentVideo.url);
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

                this.readable.destroy();

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
                    title: embedLoc.title_player.getTranslation(this.translator),
                    description: embedLoc.playback_finished.getTranslation(this.translator)
                }]
            });
        }
    }
}
