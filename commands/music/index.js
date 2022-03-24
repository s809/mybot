/**
 * @file Music commands.
 */
import { Readable } from "stream";
import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";

import { formatDuration } from "../../util.js";
import { ALMessageData } from "../../modules/messages/AlwaysLastMessage.js";
import { importCommands } from "../../modules/commands/importHelper.js";
import { Translator } from "../../modules/misc/Translator.js";

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
     * @param {Translator} translator
     */
    constructor(initialEntries, statusMsg, conn, translator) {
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

        /** @type {Translator} Translator of this entry. */
        this.translator = translator;
    }

    /**
     * Updates status text with new text, if it's defined.
     * 
     * @param {string?} text Text to update status with;
     */
    async updateStatus(text) {
        switch (text) {
            case null:
                this.text = null;
                break;
            case undefined:
                break;
            default:
                this.text = text + "\n";
        }

        let currentDurationStr = this.currentVideo?.duration
            ? formatDuration(this.currentVideo.duration)
            : this.translator.translate("common.unknown");
        let queueData = this.getQueueData();

        /** @type {import("discord.js").MessageEditOptions} */
        let options = {
            embeds: [{
                title: this.text ?? this.translator.translate("embeds.music.player_title"),
                description: this.translator.translate("embeds.music.now_playing", this.currentVideo.title, currentDurationStr) + queueData.text,
                footer: {
                    text: this.queue.length
                        ? this.translator.translate("embeds.music.queue_summary", queueData.formattedDuration)
                        : null
                }
            }]
        }
        
        if (!text)
            await this.statusMessage.editWithoutDeleting(options);
        else
            await this.statusMessage.edit(options);
    }

    getQueueData() {
        let result = "";
        let duration = 0;
        let tooLongFlag = false;
        for (let pos = 0; pos < this.queue.length; pos++) {
            let entry = this.queue[pos];

            duration += entry.duration ?? 0;

            if (result.length < 2000) {
                let durationStr = entry.duration ? formatDuration(entry.duration) : this.translator.translate("common.unknown");
                result += `${pos + 1}) ${entry.title ?? `<${entry.url}>`} (${durationStr})\n`;
            } else if (!tooLongFlag) {
                result += "...";
                tooLongFlag = true;
            }
        }

        return {
            formattedDuration: formatDuration(duration),
            text: result
        };
    }
}

export const name = "music";
export const subcommands = await importCommands(import.meta.url);
