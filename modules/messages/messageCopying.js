import { Message } from "discord.js";
import { client, data } from "../../env.js";
import { getOrCreateWebhook, sendWebhookMessage } from "./sendWebhookMessage.js";

/**
 * @typedef {import("discord.js").Snowflake} Snowflake
 * @private
 */

/** @type {Map<Snowflake, Message[]>} */
const messageBuffers = new Map();

/**
 * @param {import("../data/channelLinking.js").ChannelLink} link
 * @param {Message} msg
 */
async function copySingleMessage(link, msg) {
    const id = link.channelId;
    let destChannel = client.channels.resolve(id);

    if (BigInt(msg.id) <= BigInt(link.lastMessageId)) return;

    await sendWebhookMessage(msg, await getOrCreateWebhook(destChannel));
    
    link.lastMessageId = msg.id;
}

/**
 * @param {import("../data/channelLinking.js").ChannelLink} link
 */
async function doCopyMessages(link) {
    const id = link.channelId;

    while (messageBuffers.get(id)?.length) {
        let msg = messageBuffers.get(id).shift();
        await copySingleMessage(link, msg);
    }

    messageBuffers.delete(id);
}

/**
 * Starts copying messages in background.
 * 
 * @param {import("../data/channelLinking.js").ChannelLink} link
 * @param {Message[]} messages
 */
export function startCopyingMessages(link, messages) {
    messageBuffers.set(link.channelId, messages.concat(messageBuffers.get(link.channelId) ?? []));

    doCopyMessages(link);
}

/**
 * Sends a message to linked channel or adds in queue.
 * 
 * @param {Message} msg Message to be sent.
 */
export async function copyMessageToLinkedChannel(msg) {
    /** @type {import("../data/channelLinking.js").ChannelLink} */
    let link = data.guilds[msg.guild.id].channels[msg.channelId].link;

    let buffer = messageBuffers.get(link.channelId);
    if (buffer)
        buffer.push(msg);
    else
        await copySingleMessage(link, msg);
}

/**
 * Checks whether copying is running on specified channel.
 * 
 * @param {Snowflake} id
 * @returns {boolean}
 */
export function isCopying(id) {
    return false;
}

/**
 * Initializes queue if it was not initialized.
 * 
 * @param {Snowflake} id
 */
export function initBuffer(id) {
    messageBuffers.set(id, messageBuffers.get(id) ?? []);
}

/**
 * Stops copying and removes buffer.
 * 
 * @param {Snowflake} id
 */
export function stopCopying(id) {
    messageBuffers.delete(id);
}
