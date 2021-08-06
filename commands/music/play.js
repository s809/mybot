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
import { sleep } from "../../util.js";
import { createDiscordJSAdapter } from "../../modules/voiceadapter.js";
import ytdl from "ytdl-core-discord";
import { musicPlayingGuilds } from "../../env.js";
import { sendAlwaysLastMessage } from "../../modules/AlwaysLastMessage.js";
import { exec } from "child_process";
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
        let { stdout } = await promisify(exec)(`youtube-dl --dump-json ${url}`);
        let json = JSON.parse(stdout);

        video = {
            url: url,
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

        // eslint-disable-next-line no-constant-condition
        while (true) {
            let currentVideo = entry.queue.shift();
            if (!currentVideo) return true;

            entry.currentVideo = currentVideo;
            await entry.updateStatus("Buffering...");

            entry.readable = await ytdl(currentVideo.url, { highWaterMark: 1 << 30 });
            entry.resource = createAudioResource(entry.readable);

            player.play(entry.resource);
            await entersState(player, AudioPlayerStatus.Playing, 10000);

            await entry.updateStatus("Ready!");

            do {
                await new Promise(resolve => player.once("stateChange", resolve));
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
export const description = "play a video from YouTube by URL/unpause playback";
export const args = "[yt_url]";
export const minArgs = 0;
export const maxArgs = 1;
export const func = play;
