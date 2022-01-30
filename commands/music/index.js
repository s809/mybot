/**
 * @file Music commands.
 */
import { Readable } from "stream";
import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";

import { formatDuration } from "../../util.js";
import { ALMessageData } from "../../modules/messages/AlwaysLastMessage.js";
import { importCommands } from "../../modules/commands/importHelper.js";
import { getTranslation } from "../../modules/misc/translations.js";

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
     * @param {string} language
     */
    constructor(initialEntries, statusMsg, conn, language) {
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

        /** @type {string} Language of this entry. */
        this.language = language;
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

        let durationStr = this.currentVideo?.duration ? formatDuration(this.currentVideo.duration) : getTranslation(this.language, "common", "unknown");
        let result = this.text + getTranslation(this.language, "common", "now_playing", this.currentVideo?.title, durationStr) + this.printQueue();

        if (result.length > 2000)
            result = result.slice(0, 2000 - 3) + "...";

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

            let durationStr = entry.duration ? formatDuration(entry.duration) : getTranslation(this.language, "common", "unknown");
            result += `${pos + 1}) ${entry.title ?? `<${entry.url}>`} (${durationStr})\n`;
            duration += entry.duration ?? 0;
        }

        return getTranslation(this.language, "common", "queue_summary", this.queue.length, formatDuration(duration)) + result;
    }
}

export const name = "music";
export const subcommands = await importCommands(import.meta.url);
