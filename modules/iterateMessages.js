/**
 * @file Provides functions for iterating by messages.
 */
"use strict";

import Discord from "discord.js";
import { clamp } from "../util.js";

const maxFetchMessages = 100;

/**
 * Iterates messages, top-to-bottom.
 * 
 * @param {Discord.Channel} channel Channel to iterate messages from.
 * @param {number?} count Amount of messages to iterate.
 * @yields {Discord.Message} Messages from a channel.
 * @example iterateMessagesFromTop(channel, count);
 */
async function* iterateMessagesFromTop(channel, count) {
    let lastMessageId = 0;
    for (let i = 0; i < count; i += maxFetchMessages)
    {
        let fetchCount = clamp(count - i, 100);

        let messages = [...(await channel.messages.fetch({
            after: lastMessageId, 
            limit: fetchCount
        })).values()];
        lastMessageId = messages[messages.length - 1].id;

        for (let message of messages.reverse())
            yield message;

        if (messages.length < 100) return;
    }
}

/**
 * Iterates messages, bottom-to-top.
 * 
 * @param {Discord.Channel} channel Channel to iterate messages from.
 * @param {number?} count Amount of messages to iterate.
 * @yields Messages from a channel.
 * @example iterateMessagesFromBottom(channel, count);
 */
async function* iterateMessagesFromBottom(channel, count) {
    let firstMessageId = channel.lastMessageId;
    for (let i = 0; i < count; i += maxFetchMessages)
    {
        let fetchCount = clamp(count - i, 100);

        let messages = [...(await channel.messages.fetch({
            before: firstMessageId, 
            limit: fetchCount
        })).values()];
        firstMessageId = messages[0].id;

        for (let message of messages)
            yield message;

        if (messages.length < 100) return;
    }
}

/**
 * Iterate through messages, bottom-to-top.
 * When {@link fromBeginning} is true, iterates top-to-bottom.
 * 
 * @param {Discord.Channel} channel Channel to iterate messages from.
 * @param {number} count Amount of messages to iterate.
 * @param {boolean} fromBeginning Whether to iterate from beginning of a channel.
 * @yields Messages from a channel.
 * @example iterateMessages(msg.channel, count = 10, fromBeginning = true);
 */
export default async function* iterateMessages(channel, count = null, fromBeginning = false) {
    if (count !== null && (typeof count !== "number" || count < 1))
        throw new Error("Invalid count parameter.");

    let iterateFunc;

    if (fromBeginning)
        iterateFunc = iterateMessagesFromTop;
    else
        iterateFunc = iterateMessagesFromBottom;

    for await (let message of iterateFunc(channel, count))
        yield message;
}
