/**
 * @file Module for syncing cloned channels.
 */

import Discord, { TextChannel } from "discord.js";
import { client } from "../../env.js";
import iterateMessages from "./iterateMessages.js";
import { startCopyingMessages } from "./messageCopying.js";

/**
 * Synchronizes a channel with channel mapped to it.
 * 
 * @param {Discord.Snowflake} srcId ID of source channel.
 * @param {import("../data/channelLinking.js").ChannelLink} link
 * @param {number} count
 */
export default async function fetchAndCopyMessages(srcId, link, count) {
    let srcChannel = client.channels.resolve(srcId);

    if (!(srcChannel instanceof TextChannel)) return;
    if (!srcChannel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"])) return;

    let messages = [];
    for await (let message of iterateMessages(srcChannel, srcChannel.lastMessageId, link.lastMessageId, count))
        messages.unshift(message);

    startCopyingMessages(link, messages);
}
