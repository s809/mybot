/**
 * @file Command for starting playback.
 */
import Discord from "discord.js";
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus
} from "@discordjs/voice";
import { createDiscordJSAdapter } from "../../modules/music/voiceAdapter.js";
import { isDebug, musicPlayingGuilds } from "../../env.js";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage.js";
import { once } from "events";
import { setTimeout } from "timers/promises";
import { fetchVideoByUrl, fetchVideoOrPlaylist, getDownloadStream } from "../../modules/music/youtubeDl.js";
import { makeOpusStream } from "../../modules/music/ffmpeg.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

const timeouts = {
    ...isDebug
        ? {
            voiceReady: 15000,
            playerPlaying: 30000,
        }
        : {
            voiceReady: 5000,
            playerPlaying: 10000,
        },
    playerIdle: 3000,
    paused: 120000
};

/**
 * Fills missing data in background.
 * 
 * @param {import("./index.js").MusicPlayerEntry} playerEntry
 */
async function fillMissingData(playerEntry) {
    if (playerEntry.isLoading) return;
    playerEntry.isLoading = true;

    try {
        for (let pos = 0; pos < playerEntry.queue.length; pos++) {
            let entry = playerEntry.queue[pos];
            if (entry.title) continue;

            entry = await fetchVideoByUrl(entry.url);

            // Throw away results and exit if player is stopped.
            if (!playerEntry.isLoading) return;

            playerEntry.queue[pos] = entry;

            playerEntry.updateStatus();
        }
    }
    finally {
        playerEntry.isLoading = false;
        await once(playerEntry.statusMessage, "editComplete");
    }
}

/**
 * Starts playback.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @param {string} url URL of a track.
 * @param {string} startPosition Start position in playlist.
 * @returns {boolean} Whether the execution was successful.
 */
async function play(msg, url, startPosition) {
    let language = getLanguageByMessage(msg);

    if (url?.match(/(\\|'|")/))
        return getTranslation(language, "errors", "invalid_url");

    let voiceChannel = msg.member.voice.channel;
    if (!voiceChannel)
        return getTranslation(language, "errors", "not_in_voice");

    let entry = musicPlayingGuilds.get(voiceChannel.guild);

    if (entry?.player.state.status === AudioPlayerStatus.Paused) {
        entry.player.unpause();
        if (!url) return;
    }

    if (!url)
        return getTranslation(language, "errors", "no_url");

    /** @type {import("./index.js").QueueEntry[]} */
    let videos = await fetchVideoOrPlaylist(url);

    // Validate start time/position
    if (startPosition) {
        if (!startPosition.match(/^\d{1,2}$/) || parseInt(startPosition) < 1) {
            return getTranslation(language, "errors", "invalid_start_position");
        }
        else {
            startPosition = parseInt(startPosition);
            if (startPosition - 1 >= videos.length)
                return getTranslation(language, "errors", "no_videos_added");

            videos = videos.slice(startPosition - 1);
        }
    }

    if (entry) {
        entry.queue.push(videos.length > 1 ? [...videos] : videos[0]);
        await entry.updateStatus(getTranslation(language, "common", "queued"));
        return;
    }

    const statusMessage = await sendAlwaysLastMessage(msg.channel, getTranslation(language, "common", "initializing_player"));

    const conn = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        selfMute: false,
        adapterCreator: createDiscordJSAdapter(voiceChannel)
    });

    const { MusicPlayerEntry } = await import("./index.js");
    entry = new MusicPlayerEntry(videos, statusMessage, conn, language);
    musicPlayingGuilds.set(voiceChannel.guild, entry);

    try {
        await entersState(conn, VoiceConnectionStatus.Ready, timeouts.voiceReady);

        const player = createAudioPlayer();
        player.on("error", () => { /* Ignored */ });
        entry.player = player;
        conn.subscribe(player);

        while (entry.queue.length) {
            let currentVideo = entry.queue.shift();
            if (!currentVideo.title)
                currentVideo = await fetchVideoByUrl(currentVideo.url);
            entry.currentVideo = currentVideo;

            fillMissingData(entry).catch(console.log);

            try {
                if (msg.guild.me.voice.channel.type === "GUILD_STAGE_VOICE")
                    await msg.guild.me.voice.setSuppressed(false);
            }
            catch (e) {
                return getTranslation(language, "errors", "cannot_become_speaker");
            }
            await entry.updateStatus(getTranslation(language, "common", "buffering"));

            let video = await getDownloadStream(currentVideo.url);
            let ffmpeg = await makeOpusStream(video);
            ffmpeg.on("close", () => video.destroy());

            entry.readable = ffmpeg;
            entry.resource = createAudioResource(entry.readable);

            player.play(entry.resource);
            await entersState(player, AudioPlayerStatus.Playing, timeouts.playerPlaying);

            await entry.updateStatus(getTranslation(language, "common", "ready"));

            do {
                if (player.state.status === AudioPlayerStatus.Paused) {
                    await Promise.any([
                        setTimeout(timeouts.paused),
                        once(player, "stateChange")
                    ]);
                    if (player.state.status === AudioPlayerStatus.Paused)
                        return;
                }
                await once(player, "stateChange");
            }
            while (![AudioPlayerStatus.Idle, AudioPlayerStatus.AutoPaused].includes(player.state.status));

            video.destroy();
            ffmpeg.destroy();

            switch (player.state.status) {
                case AudioPlayerStatus.Idle:
                    await setTimeout(timeouts.playerIdle);
                    break;
                case AudioPlayerStatus.AutoPaused:
                    return;
            }
        }
    } finally {
        musicPlayingGuilds.delete(voiceChannel.guild);
        entry.readable?.destroy();
        entry.isLoading = false;
        conn.destroy();
    }
}

export const name = "play";
export const args = "[url|\"query\"] [startPos (0-99)]";
export const minArgs = 0;
export const maxArgs = 2;
export const func = play;
