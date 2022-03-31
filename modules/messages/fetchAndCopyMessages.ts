/**
 * @file Module for syncing cloned channels.
 */

import { Snowflake, TextChannel } from "discord.js";
import { client } from "../../env";
import { ChannelLink } from "../data/channelLinking";
import iterateMessages from "./iterateMessages";
import { startCopyingMessages } from "./messageCopying";

/**
 * Synchronizes a channel with channel mapped to it.
 * 
 * @param srcId ID of source channel.
 */
export default async function fetchAndCopyMessages(srcId: Snowflake, link: ChannelLink, count: number = null) {
    let srcChannel = client.channels.resolve(srcId);

    if (!(srcChannel instanceof TextChannel)) return;
    if (!srcChannel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"])) return;

    let messages = [];
    for await (let message of iterateMessages(srcChannel, srcChannel.lastMessageId, link.lastMessageId, count))
        messages.unshift(message);

    startCopyingMessages(link, messages);
}
