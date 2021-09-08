/**
 * @file Module for syncing cloned channels.
 */
"use strict";

import { Message, TextChannel } from "discord.js";
import EventEmitter from "events";

/**
 * Wrapper for resending edited message if it's not last in channel.
 */
class ALMessageData extends EventEmitter {
    /**
     * Constructs AlwaysLastMessage instance.
     * 
     * @param {Message} msg Message to wrap.
     */
    constructor(msg) {
        super();
        /** @type {Message} */
        this.message = msg;
        this.editing = false;
    }

    /**
     * Edits or resends message with new content.
     * 
     * @param {string | import("discord.js").MessagePayload | import("discord.js").MessageOptions} options Content to fill new message with.
     */
    async edit(options) {
        if (this.editing) {
            this.lastOptions = options;
            return this;
        }

        this.lastOptions = options;
        this.editInternal();
        return this;
    }

    async editInternal() {
        let options;
        this.editing = true;

        let resendFunc = async () => {
            this.message = await this.message.channel.send(options);
        };

        while (options !== this.lastOptions) {
            options = this.lastOptions;

            if (this.message.channel.lastMessageId !== this.message.id)
                await Promise.all([
                    this.message.delete(),
                    resendFunc()
                ]);
            else
                this.message = await this.message.edit(options);
        }

        delete this.lastOptions;

        this.editing = false;
        this.emit("editComplete");
    }
}

/**
 * 
 * @param {Message} msg
 */
function wrapALMessage(msg) {
    let data = new ALMessageData(msg);
    return new Proxy(data, {
        get: (target, name) => (name in target ? target[name] : data.message[name])
    });
}

/**
 * Sends and creates wrapper for resending a message when edited.
 * 
 * @param {TextChannel} channel Channel in which to send message.
 * @param {string | import("discord.js").MessagePayload | import("discord.js").MessageOptions} options Content to fill new message with.
 * @returns Wrapped message.
 */
export async function sendAlwaysLastMessage(channel, options) {
    let message = await channel.send(options);
    return wrapALMessage(message);
}
