/**
 * @file Module for syncing cloned channels.
 */
import { Message, TextBasedChannel } from "discord.js";
import EventEmitter from "events";

type MessageSendOptions = Parameters<TextBasedChannel["send"]>[0];

/**
 * Wrapper for resending edited message if it's not last in channel.
 */
export class AlwaysLastMessage extends EventEmitter {
    message: Message;
    editing: boolean = false;
    lastOptions: Parameters<Message["edit"]>[0];

    /**
     * Constructs AlwaysLastMessage instance.
     * 
     * @param msg Message to wrap.
     */
    constructor(msg: Message) {
        super();
        this.message = msg;
    }

    /**
     * Edits or resends message with new content.
     * 
     * @param options Content to fill new message with.
     */
    async edit(options: this["lastOptions"]) {
        if (this.editing) {
            this.lastOptions = options;
            return this;
        }

        this.lastOptions = options;
        this.editInternal();
        return this;
    }

    private async editInternal() {
        let options: this["lastOptions"];
        this.editing = true;

        let resendFunc = async () => {
            this.message = await this.message.channel.send(options as MessageSendOptions);
        };

        while (options !== this.lastOptions) {
            options = this.lastOptions;

            if (this.message.channel.lastMessageId !== this.message.id)
                await Promise.all([
                    this.message.delete().catch(() => { }),
                    resendFunc()
                ]);
            else
                this.message = await this.message.edit(options);
        }

        delete this.lastOptions;

        this.editing = false;
        this.emit("editComplete");
    }

    /**
     * Edits message without resending.
     */
    async editWithoutDeleting(options: this["lastOptions"]) {
        if (!this.editing)
            this.message.edit(options);
    }
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

function wrapALMessage(msg: Message) {
    let data = new AlwaysLastMessage(msg);
    return new Proxy(data, {
        get: (target, name) => ((name in target ? target : data.message as any)[name])
    }) as Overwrite<Message, AlwaysLastMessage>;
}

/**
 * Sends and creates wrapper for resending a message when edited.
 * 
 * @param channel Channel in which to send message.
 * @param options Content to fill new message with.
 * @returns Wrapped message.
 */
export async function sendAlwaysLastMessage(channel: TextBasedChannel, options: MessageSendOptions) {
    let message = await channel.send(options);
    return wrapALMessage(message);
}
