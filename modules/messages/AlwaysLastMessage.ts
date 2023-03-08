/**
 * @file Module for syncing cloned channels.
 */
import { Message, TextBasedChannel } from "discord.js";
import EventEmitter from "events";
import { Overwrite } from "../../util";

type MessageSendOptions = Parameters<Extract<TextBasedChannel, { send: any }>["send"]>[0];

export type AlwaysLastMessage = Overwrite<Message, AlwaysLastMessageWrapper>;

/**
 * Wrapper for resending edited message if it's not last in channel.
 */
class AlwaysLastMessageWrapper extends EventEmitter {
    message: Message;
    editing: boolean = false;
    lastOptions?: Parameters<Message["edit"]>[0];

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
     * Do not await unless you want a moment when all edits are done.
     * 
     * @param options Content to fill new message with.
     */
    async edit(options: this["lastOptions"]) {
        if (this.editing) {
            this.lastOptions = options;
            return this;
        }

        this.lastOptions = options;
        await this.editInternal();
        return this;
    }

    private async editInternal() {
        let options: this["lastOptions"] = undefined;
        this.editing = true;

        while (options !== this.lastOptions) {
            options = this.lastOptions!;

            if (this.message.channel.lastMessageId !== this.message.id) {
                await Promise.all([
                    this.message.delete().catch(() => { }),
                    this.message.channel.send(options as MessageSendOptions)
                        .then(message => this.message = message)
                ]);
            } else {
                this.message = await this.message.edit(options);
            }
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
            this.message = await this.message.edit(options!);
    }
}

/**
 * Sends and creates a wrapper for resending a message when edited.
 * 
 * @param message Message to wrap.
 * @returns Wrapped message.
 */
export function wrapAlwaysLastMessage(message: Message) {
    let wrapped = new AlwaysLastMessageWrapper(message);
    return new Proxy(wrapped, {
        get: (target, name) => ((name in target ? target : wrapped.message as any)[name])
    }) as AlwaysLastMessage;
}

/**
 * Sends and creates a wrapper for resending a message when edited.
 * 
 * @param channel Channel in which to send message.
 * @param options Content to fill new message with.
 * @returns Wrapped message.
 */
export async function sendAlwaysLastMessage(channel: TextBasedChannel, options: MessageSendOptions) {
    return wrapAlwaysLastMessage(await channel.send(options));
}
