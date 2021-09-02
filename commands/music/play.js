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
import { createDiscordJSAdapter } from "../../modules/voiceadapter.js";
import ytdl from "ytdl-core-discord";
import { musicPlayingGuilds } from "../../env.js";
import { sendAlwaysLastMessage } from "../../modules/AlwaysLastMessage.js";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { MusicPlayerEntry } from "./index.js";

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

    if (entry?.player.state.status === AudioPlayerStatus.Paused)
    {
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

    /** @type {import("./index.js").YoutubeVideo} */
    let video;
    {
        let { stdout } = await promisify(execFile)("youtube-dl", [
            "--dump-json",
            "--default-search",
            "ytsearch",
            url
        ]);
        let json = JSON.parse(stdout);

        video = {
            url: json.webpage_url,
            title: json.title,
            creator: json.creator,
            thumbnail: json.thumbnail,
        };
    }

    if (entry)
    {
        entry.queue.push(video);
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

    entry = new MusicPlayerEntry(video, statusMessage, conn);
    musicPlayingGuilds.set(voiceChannel.guild, entry);

    try {
        await entersState(conn, VoiceConnectionStatus.Ready, 30000);

        const player = createAudioPlayer();
        entry.player = player;
        conn.subscribe(player);

        while (entry.queue.length) {
            let currentVideo = entry.queue.shift();
            entry.currentVideo = currentVideo;

            await entry.updateStatus("Buffering...");

            if (currentVideo.url.match(/:\/\/(((music|www)\.)?youtube\.com|youtu\.be)\//i)) {
                entry.readable = await ytdl(currentVideo.url, { highWaterMark: 1 << 30 });
            }
            else {
                let video = spawn("youtube-dl", [
                    "-f",
                    "bestaudio",
                    "-o",
                    "-",
                    currentVideo.url
                ]);
                video.stderr.pipe(process.stderr);

                let ffmpeg = spawn("ffmpeg -i - -f opus -", { shell: true });
                ffmpeg.stderr.pipe(process.stderr);

                video.stdout.pipe(ffmpeg.stdin);
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
    } finally {
        musicPlayingGuilds.delete(voiceChannel.guild);
        entry.readable?.destroy();
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
