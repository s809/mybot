/**
 * @file Command for starting playback.
 */
"use strict";

import Discord, { Message } from "discord.js";
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
import ytdl from "ytdl-core-discord";
import { isDebug, musicPlayingGuilds } from "../../env.js";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage.js";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { MusicPlayerEntry } from "./index.js";

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
 * @param {MusicPlayerEntry} playerEntry
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

            await playerEntry.updateStatus();
        }
    }
    finally {
        playerEntry.isLoading = false;
    }
}

/**
 * Starts playback.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @param {string} url URL of track.
 * @returns {boolean} Whether the execution was successful.
 */
async function play(msg, url) {
    let voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) {
        await msg.channel.send("Join any voice channel and try again.");
        return false;
    }

    let entry = musicPlayingGuilds.get(voiceChannel.guild);

    if (entry?.player.state.status === AudioPlayerStatus.Paused) {
        entry.player.unpause();
        if (!url) return true;
    }

    if (!url) {
        await msg.channel.send("No URL specified.");
        return false;
    }

    if (url.match(/(\\|'|")/)) {
        await msg.channel.send("URL is invalid.");
        return false;
    }

    /** @type {import("./index.js").QueueEntry[]} */
    let videos;
    {
        let { stdout } = await promisify(execFile)("youtube-dl", [
            "--dump-json",
            "--no-playlist",
            "--flat-playlist",
            "--default-search",
            "ytsearch",
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

    if (entry) {
        entry.queue.push([...videos]);
        await entry.updateStatus("Queued!");
        return true;
    }

    const statusMessage = await sendAlwaysLastMessage(msg.channel, "Initializing player...");

    const conn = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        selfMute: false,
        adapterCreator: createDiscordJSAdapter(voiceChannel)
    });

    entry = new MusicPlayerEntry(videos, statusMessage, conn);
    musicPlayingGuilds.set(voiceChannel.guild, entry);

    try {
        await entersState(conn, VoiceConnectionStatus.Ready, 30000);

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

            if (currentVideo.url.match(/:\/\/(((music|www)\.)?youtube\.com|youtu\.be)\//i)) {
                entry.readable = await ytdl(currentVideo.url, { highWaterMark: 1 << 30 });
            }
            else {
                let video = spawn("youtube-dl", [
                    "-f", "bestaudio/best",
                    "-o", "-",
                    currentVideo.url
                ]);
                if (isDebug)
                    video.stderr.pipe(process.stderr);

                let ffmpeg = spawn("ffmpeg", [
                    "-i", "-",
                    "-f", "opus",
                    "-b:a", "384k",
                    "-"
                ]);
                if (isDebug)
                    ffmpeg.stderr.pipe(process.stderr);

                video.stderr.setEncoding("utf8");
                video.stderr.on("data", chunk => {
                    if (chunk.includes("ERROR"))
                        ffmpeg.stdout.destroy();
                });

                let pipe = video.stdout.pipe(ffmpeg.stdin);
                pipe.on("error", () => { /* Ignored */ });

                entry.readable = ffmpeg.stdout;
            }
            entry.resource = createAudioResource(entry.readable);

            player.play(entry.resource);
            await entersState(player, AudioPlayerStatus.Playing, 10000);

            await entry.updateStatus("Ready!");

            do {
                await awaitEvent(player, "stateChange");
            }
            while (![AudioPlayerStatus.Idle, AudioPlayerStatus.AutoPaused].includes(player.state.status));

            switch (player.state.status) {
                case AudioPlayerStatus.Idle:
                    await sleep(3000);
                    break;
                case AudioPlayerStatus.AutoPaused:
                    return true;
            }
        }

        return true;
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
export const args = "[url|\"query\"]";
export const minArgs = 0;
export const maxArgs = 1;
export const func = play;
