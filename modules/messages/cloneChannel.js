/**
 * @file Module for syncing cloned channels.
 */
"use strict";

import Discord, { TextChannel } from "discord.js";
import { client, data, pendingClones, messageBuffers } from "../../env.js";
import { sendWebhookMessageAuto } from "./sendWebhookMessage.js";
import iterateMessages from "./iterateMessages.js";

/**
 * Synchronizes a channel with channel mapped to it.
 * 
 * @param {Discord.Snowflake} channel ID of source channel.
 * @param {Discord.Snowflake} lastMessage ID of a last message in source channel.
 * @returns {Promise<number>} Amount of cloned messages.
 */
export default async function cloneChannel(channel, lastMessage) {
    /** @type {TextChannel} */
    let srcChannel = await client.channels.fetch(channel);
    /** @type {MappedChannel} */
    let mappedChannel = data.guilds[srcChannel.guild.id].mappedChannels[channel];
    let destChannel = await client.channels.fetch(mappedChannel.id);

    if (!srcChannel.messages || !(srcChannel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]))) return;

    pendingClones.set(srcChannel, destChannel);
    pendingClones.set(destChannel, srcChannel);
    messageBuffers.set(srcChannel, []);

    let messages = [];
    for await (let message of iterateMessages(srcChannel, lastMessage))
        messages.unshift(message);

    messageBuffers.set(srcChannel, messageBuffers.get(srcChannel).concat(messages));

    while (messageBuffers.get(srcChannel).length > 0) {
        let message = messageBuffers.get(srcChannel).pop();
        await sendWebhookMessageAuto(message);
    }

    pendingClones.delete(srcChannel);
    pendingClones.delete(destChannel);
    messageBuffers.delete(srcChannel);

    return messages.length;
}
