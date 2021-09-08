/**
 * @file Music commands.
 */
"use strict";

import { Readable } from "stream";
import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";
import { makeSubCommands } from "../../modules/commands/commands.js";
import { Message } from "discord.js";

import * as play from "./play.js";
import * as pause from "./pause.js";
import * as stop from "./stop.js";
import * as skip from "./skip.js";

/**
 * @typedef YoutubeVideo
 * @property {string} url
 * @property {string} title
 * @property {string} creator
 * @property {string} thumbnail
 */

/**
 * Represents audio containing resource in queue.
 */
export class MusicPlayerEntry {
    /**
     * Constructs MusicPlayerEntry instance.
     * 
     * @param {YoutubeVideo} firstEntry 
     * @param {Message} statusMsg 
     * @param {VoiceConnection} conn 
     */
    constructor(firstEntry, statusMsg, conn) {
        /** @type {YoutubeVideo[]} Queued YouTube videos. */
        this.queue = [firstEntry];

        /** @type {Message} Status message. */
        this.statusMessage = statusMsg;

        /** @type {VoiceConnection} Current voice connection. */
        this.connection = conn;

        /** @type {AudioPlayer} Current audio player. */
        this.player = undefined;

        /** @type {AudioResource} Current audio resource. */
        this.resource = undefined;
        
        /** @type {Readable} Underlying youtube-dl stream. */
        this.readable = undefined;
    }

    async updateStatus(text = "") {
        if (text)
            text += "\n";
        await this.statusMessage.edit(text + `Now playing: ${MusicPlayerEntry.formatTitle(this.currentVideo)}\n` + this.printQueue());
    }

    printQueue() {
        if (!this.queue.length) return "";
        return `Current queue size: ${this.queue.length}\n` +
            this.queue.map((v, i) => `${i + 1}) ${MusicPlayerEntry.formatTitle(v)}`).join("\n");
    }

    /**
     * Formats title of video, prepending creator name if need.
     * 
     * @param {YoutubeVideo} video Video which title to format.
     * @returns {string} Formatted video title.
     */
    static formatTitle(video) {
        if (video.creator)
            return `${video.creator} - ${video.title}`;
        else
            return video.title;
    }
}

export const name = "music";
export const subcommands = makeSubCommands(play, pause, skip, stop);
