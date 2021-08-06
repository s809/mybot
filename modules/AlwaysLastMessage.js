/**
 * @file Module for syncing cloned channels.
 */
"use strict";

import { Message, MessagePayload, TextChannel } from "discord.js";

/**
 * Wrapper for resending edited message if it's not last in channel.
 */
export default class AlwaysLastMessage {
    /**
     * Constructs AlwaysLastMessage instance.
     * 
     * @param {Message} msg Message to wrap.
     */
    constructor(msg) {
        /** @type {Message} */
        this.message = msg;
    }

    /**
     * Edits or resends message with new content.
     * 
     * @param {string | MessagePayload | import("discord.js").MessageOptions} options Content to fill new message with.
     */
    async edit(options) {
        if (this.editLock) return;
        this.editLock = true;

        if (this.message.channel.lastMessageId !== this.message.id)
            await Promise.all([
                this.message.delete(),
                (async () => {
                    this.message = await this.message.channel.send(options);
                })()
            ]);
        else
            await this.message.edit(options);

        this.editLock = false;
    }
}

/**
 * Sends and creates wrapper for resending a message when edited.
 * 
 * @param {TextChannel} channel Channel in which to send message.
 * @param {string | MessagePayload | import("discord.js").MessageOptions} options Content to fill new message with.
 * @returns {AlwaysLastMessage} New {@link AlwaysLastMessage} instance.
 */
export async function sendAlwaysLastMessage(channel, options) {
    let message = await channel.send(options);
    return new AlwaysLastMessage(message);
}
