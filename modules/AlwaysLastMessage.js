/**
 * @file Module for syncing cloned channels.
 */
"use strict";

import { Channel, Message } from "discord.js";

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
     * @param {string} content Content to fill new message with.
     */
    async edit(content) {
        if (this.editLock) return;
        this.editLock = true;

        if (this.message.channel.lastMessageID !== this.message.id)
            await Promise.all([
                this.message.delete(),
                (async () => {
                    this.message = await this.message.channel.send(content);
                })()
            ]);
        else
            await this.message.edit(content);

        this.editLock = false;
    }
}

/**
 * Sends and creates wrapper for resending a message when edited.
 * 
 * @param {Channel} channel Channel in which to send message.
 * @param {string} text Content to fill new message with.
 * @returns {AlwaysLastMessage} New {@link AlwaysLastMessage} instance.
 */
export async function sendAlwaysLastMessage(channel, text) {
    let message = await channel.send(text);
    return new AlwaysLastMessage(message);
}
