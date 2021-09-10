/**
 * @file Music commands.
 */
"use strict";

import { Readable } from "stream";
import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";
import { makeSubCommands } from "../../modules/commands/commands.js";

import * as play from "./play.js";
import * as pause from "./pause.js";
import * as stop from "./stop.js";
import * as skip from "./skip.js";
import { formatDuration } from "../../util.js";
import { ALMessageData } from "../../modules/messages/AlwaysLastMessage.js";

/**
 * @typedef QueueEntry
 * @property {string} url
 * @property {string} title
 * @property {string} uploader
 * @property {number} duration
 */

/**
 * Represents audio containing resource in queue.
 */
export class MusicPlayerEntry {
    /**
     * Constructs MusicPlayerEntry instance.
     * 
     * @param {QueueEntry[]} initialEntries 
     * @param {ALMessageData} statusMsg 
     * @param {VoiceConnection} conn 
     */
    constructor(initialEntries, statusMsg, conn) {
        /** @type {QueueEntry[]} Queued videos. */
        this.queue = initialEntries;

        /** @type {ALMessageData} Status message. */
        this.statusMessage = statusMsg;

        /** @type {VoiceConnection} Current voice connection. */
        this.connection = conn;

        /** @type {AudioPlayer} Current audio player. */
        this.player = undefined;

        /** @type {AudioResource} Current audio resource. */
        this.resource = undefined;

        /** @type {Readable} Underlying youtube-dl stream. */
        this.readable = undefined;

        /** @type {QueueEntry} Current entry. */
        this.currentVideo = undefined;

        /** @type {boolean} Whether the preloader is running. */
        this.isLoading = false;
    }

    /**
     * Updates status text with new text, if it's defined.
     * 
     * @param {string?} text Text to update status with;
     */
    async updateStatus(text) {
        switch (text) {
            case null:
                this.text = "";
                break;
            case undefined:
                break;
            default:
                this.text = text + "\n";
        }

        let durationStr = this.currentVideo?.duration ? formatDuration(this.currentVideo.duration) : "unknown";
        let result = this.text + `Now playing: ${this.currentVideo?.title} (${durationStr})\n` + this.printQueue();

        if (!text)
            await this.statusMessage.editWithoutDeleting(result);
        else
            await this.statusMessage.edit(result);
    }

    printQueue() {
        if (!this.queue.length) return "";

        let result = "";
        let duration = 0;
        for (let pos = 0; pos < this.queue.length; pos++) {
            let entry = this.queue[pos];

            let durationStr = entry.duration ? formatDuration(entry.duration) : "unknown";
            result += `${pos + 1}) ${entry.title ?? `<${entry.url}>`} (${durationStr})\n`;
            duration += entry.duration ?? 0;
        }

        return `Current queue size: ${this.queue.length} (${formatDuration(duration)})\n` + result;
    }
}

export const name = "music";
export const subcommands = makeSubCommands(play, pause, skip, stop);
