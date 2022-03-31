import { Message, Snowflake, TextChannel } from "discord.js";
import { client, data } from "../../env";
import { ChannelLink } from "../data/channelLinking";
import { getOrCreateWebhook, sendWebhookMessage } from "./sendWebhookMessage";

const messageBuffers = new Map<Snowflake, Message[]>();

async function copySingleMessage(link: ChannelLink, msg: Message) {
    const id = link.channelId;
    let destChannel = client.channels.resolve(id) as TextChannel;

    if (BigInt(msg.id) <= BigInt(link.lastMessageId)) return;

    await sendWebhookMessage(msg, await getOrCreateWebhook(destChannel));

    link.lastMessageId = msg.id;
}

async function doCopyMessages(link: ChannelLink) {
    const id = link.channelId;

    while (messageBuffers.get(id)?.length) {
        let msg = messageBuffers.get(id).shift();
        await copySingleMessage(link, msg);
    }

    messageBuffers.delete(id);
}

/**
 * Starts copying messages in background.
 */
export function startCopyingMessages(link: ChannelLink, messages: Message[]) {
    messageBuffers.set(link.channelId, messages.concat(messageBuffers.get(link.channelId) ?? []));

    doCopyMessages(link);
}

/**
 * Sends a message to linked channel or adds in queue.
 * 
 * @param msg Message to be sent.
 */
export async function copyMessageToLinkedChannel(msg: Message) {
    let link: ChannelLink = data.guilds[msg.guild.id].channels[msg.channelId].link;

    let buffer = messageBuffers.get(link.channelId);
    if (buffer)
        buffer.push(msg);
    else
        await copySingleMessage(link, msg);
}

/**
 * Checks whether copying is running on specified channel.
 */
export function isCopying(id: Snowflake): boolean {
    return false;
}

/**
 * Initializes queue if it was not initialized.
 */
export function initBuffer(id: Snowflake) {
    messageBuffers.set(id, messageBuffers.get(id) ?? []);
}

/**
 * Stops copying and removes buffer.
 */
export function stopCopying(id: Snowflake) {
    messageBuffers.delete(id);
}
