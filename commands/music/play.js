/**
 * @file Command for starting playback.
 */
"use strict";

import Discord from "discord.js";
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus
} from "@discordjs/voice";
import { awaitEvent, sleep } from "../../util.js";
import { createDiscordJSAdapter } from "../../modules/misc/voiceadapter.js";
import { isDebug, musicPlayingGuilds } from "../../env.js";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage.js";
import { execFile, spawn } from "child_process";
import { promisify } from "util";

const timeouts = {...(!isDebug ? {
    voiceReady: 5000,
    playerPlaying: 10000,
} : {
    voiceReady: 15000,
    playerPlaying: 30000,
}), ...{
    playerIdle: 3000,
    paused: 120000
}};

/**
 * Loads metadata for URL.
 * 
 * @param {import("./index.js").QueueEntry} entry Entry with URL to load.
 * @returns Entry with loaded metadata.
 */
async function loadVideo(entry) {
    let { stdout } = await promisify(execFile)("youtube-dl", [
        "--dump-json",
        "--no-playlist",
        entry.url
    ]);

    /**
     * @type {{
     *  url: string;
     *  title: string;
     *  uploader?: string;
     *  duration?: string;
     * }[]}
     */
    let json = JSON.parse(stdout);

    return {
        url: entry.url,
        title: json.title,
        uploader: json.uploader,
        duration: json.duration
    };
}

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

            entry = await loadVideo(entry);

            // Throw away results and exit if player is stopped.
            if (!playerEntry.isLoading) return;

            playerEntry.queue[pos] = entry;

            playerEntry.updateStatus();
        }
    }
    finally {
        playerEntry.isLoading = false;
        await awaitEvent(playerEntry.statusMessage, "editComplete");
    }
}

/**
 * Starts playback.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @param {string} url URL of a track.
 * @param {string} startTimeOrPos Start time of a track.
 * @returns {boolean} Whether the execution was successful.
 */
async function play(msg, url, startTimeOrPos) {
    if (url?.match(/(\\|'|")/))
        return "URL is invalid.";

    let voiceChannel = msg.member.voice.channel;
    if (!voiceChannel)
        return "Join any voice channel and try again.";

    let entry = musicPlayingGuilds.get(voiceChannel.guild);

    if (entry?.player.state.status === AudioPlayerStatus.Paused) {
        entry.player.unpause();
        if (!url) return;
    }

    if (!url)
        return "No URL specified.";

    /** @type {import("./index.js").QueueEntry[]} */
    let videos;
    {
        let { stdout } = await promisify(execFile)("youtube-dl", [
            "--dump-json",
            "--no-playlist",
            "--flat-playlist",
            "--default-search", "ytsearch",
            url
        ]);

        /**
         * @type {{
         *  url?: string;
         *  webpage_url?: string;
         *  title?: string;
         *  uploader?: string;
         *  duration?: string;
         * }[]}
         */
        let json = JSON.parse(`[${stdout.replaceAll("\n{", ",\n{")}]`);

        videos = json.map(item => ({
            url: item.webpage_url ?? item.url,
            title: item.title,
            uploader: item.uploader,
            duration: item.duration
        }));
    }

    // Validate start time/position
    if (startTimeOrPos) {
        if (videos.length < 2) {
            if (entry)
                return "Cannot use start time when already playing.";

            if (!startTimeOrPos.match(/^(\d{1,2}|:\d{2}){1,3}$/))
                return "Start time is invalid.";
        }
        else if (!startTimeOrPos.match(/^\d{1,5}$/) || parseInt(startTimeOrPos) < 1) {
            return "Start position is invalid.";
        }
        else {
            startTimeOrPos = parseInt(startTimeOrPos);
            if (startTimeOrPos - 1 >= videos.length)
                return "At least one video should be added to queue.";

            videos = videos.slice(startTimeOrPos - 1);
            startTimeOrPos = null;
        }
    }

    if (entry) {
        entry.queue.push(videos.length > 1 ? [...videos] : videos[0]);
        await entry.updateStatus("Queued!");
        return;
    }

    const statusMessage = await sendAlwaysLastMessage(msg.channel, "Initializing player...");

    const conn = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        selfMute: false,
        adapterCreator: createDiscordJSAdapter(voiceChannel)
    });

    entry = new (await import("./index.js")).MusicPlayerEntry(videos, statusMessage, conn);
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
                currentVideo = await loadVideo(currentVideo);
            entry.currentVideo = currentVideo;

            fillMissingData(entry).catch(console.log);

            await entry.updateStatus("Buffering...");

            let video = spawn("youtube-dl", [
                "-f", "bestaudio/best",
                "-o", "-",
                currentVideo.url
            ]);

            let ffmpeg = spawn("ffmpeg", [
                "-ss", startTimeOrPos ?? "0",
                "-i", "-",
                "-vn",
                "-f", "opus",
                "-b:a", "384k",
                "-"
            ]);

            let videoStderr = "";
            /** @type {Error} */
            let error = null;
            video.stderr.setEncoding("utf8");
            video.stderr.on("data", async chunk => {
                videoStderr += chunk;
                
                if (chunk.includes("ERROR")) {
                    ffmpeg.stdout.destroy();

                    error = new Error("Download failed");
                    console.log(videoStderr);
                }
            });

            const throwOnError = async () => {
                if (error) {
                    if (isDebug)
                        throw error;
                    else
                        await msg.channel.send(`Unable to play this track: ${error.message}.`);
                    error = null;
                }
            };

            if (isDebug) {
                video.stderr.pipe(process.stderr);
                ffmpeg.stderr.pipe(process.stderr);
            }

            let pipe = video.stdout.pipe(ffmpeg.stdin);
            pipe.on("error", () => { /* Ignored */ });

            entry.readable = ffmpeg.stdout;
            entry.resource = createAudioResource(entry.readable);

            try {
                player.play(entry.resource);
                await entersState(player, AudioPlayerStatus.Playing, timeouts.playerPlaying);
            }
            catch (e) {
                if (error) {
                    await throwOnError();
                    continue;
                }
                else {
                    throw e;
                }
            }

            await entry.updateStatus("Ready!");

            do {
                if (player.state.status === AudioPlayerStatus.Paused) {
                    await Promise.any([
                        sleep(timeouts.paused),
                        awaitEvent(player, "stateChange")
                    ]);
                    if (player.state.status === AudioPlayerStatus.Paused)
                        return;
                }
                await awaitEvent(player, "stateChange");
            }
            while (![AudioPlayerStatus.Idle, AudioPlayerStatus.AutoPaused].includes(player.state.status));

            await throwOnError();

            switch (player.state.status) {
                case AudioPlayerStatus.Idle:
                    await sleep(timeouts.playerIdle);
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
export const description = "play a video.\n" +
    "If no URL or query is specified, unpauses playback.\n" +
    "Queries are searched on YouTube, but URL can be from any source.\n" +
    "Quotes are not required for one-word queries";
export const args = "[url|\"query\"] [startPos (0-99999)|startTime (0-99:99:99)]";
export const minArgs = 0;
export const maxArgs = 2;
export const func = play;
