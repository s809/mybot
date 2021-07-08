/**
 * @file Provides functions for iterating by messages.
 */
"use strict";

import Discord from "discord.js";

const maxFetchMessages = 100;

/**
 * Iterates messages, top-to-bottom.
 * 
 * @param {Discord.TextChannel} channel Channel to iterate messages from.
 * @param {Discord.Snowflake?} oldestId Iteration start ID.
 * @param {Discord.Snowflake?} latestId Iteration end ID.
 * @param {number?} count Amount of messages to iterate.
 * @yields Messages from a channel.
 */
async function* iterateMessagesFromTop(channel, oldestId, latestId, count) {
    let firstMessageId = oldestId ?? 0;

    // eslint-disable-next-line no-unmodified-loop-condition
    for (let collectedCount = 0; collectedCount < count || count === null; collectedCount += maxFetchMessages) {
        if (count === null)
            collectedCount = -maxFetchMessages;

        let fetchCount = Math.min(count - collectedCount, maxFetchMessages);

        let messages = [...(await channel.messages.fetch({
            after: firstMessageId,
            limit: fetchCount
        })).values()];
        firstMessageId = messages[0].id;

        for (let message of messages.reverse()) {
            if (parseInt(message.id) > parseInt(latestId)) return;
            yield message;
        }

        if (messages.length < maxFetchMessages) return;
    }
}

/**
 * Iterates messages, bottom-to-top.
 * 
 * @param {Discord.TextChannel} channel Channel to iterate messages from.
 * @param {Discord.Snowflake?} latestId Iteration start ID.
 * @param {Discord.Snowflake?} oldestId Iteration end ID.
 * @param {number?} count Amount of messages to iterate.
 * @yields Messages from a channel.
 */
async function* iterateMessagesFromBottom(channel, latestId, oldestId, count) {
    let lastMessageId = latestId ?? channel.lastMessageId;

    // eslint-disable-next-line no-unmodified-loop-condition
    for (let collectedCount = 0; collectedCount < count || count === null; collectedCount += maxFetchMessages) {
        if (count === null)
            collectedCount = -maxFetchMessages;

        let fetchCount = Math.min(count - collectedCount, maxFetchMessages);

        let messages = [...(await channel.messages.fetch({
            before: lastMessageId,
            limit: fetchCount
        })).values()];
        lastMessageId = messages[messages.length - 1].id;

        for (let message of messages) {
            if (parseInt(message.id) < parseInt(oldestId)) return;
            yield message;
        }

        if (messages.length < maxFetchMessages) return;
    }
}

/**
 * Iterate through messages.
 * 
 * | Presence of arguments           | Direction     | Comment |
 * | :--------------------           | :------------ | :------ |
 * | None                            | bottom-to-top |
 * | {@link startId} only            | top-to-bottom |
 * | {@link endId} only              | bottom-to-top | Iteration begins from {@link endId} |
 * | {@link startId} < {@link endId} | top-to-bottom |
 * | {@link startId} > {@link endId} | bottom-to-top |
 * 
 * @param {Discord.TextChannel} channel Channel to iterate messages from.
 * @param {Discord.Snowflake?} startId ID before first message in iteration.
 * @param {Discord.Snowflake?} endId ID of last message in iteration.
 * @param {number?} count Amount of messages to iterate.
 * @yields Messages from a channel.
 */
export default async function* iterateMessages(channel, startId = null, endId = null, count = null) {
    if (count !== null && (typeof count !== "number" || count < 1))
        throw new Error("Invalid count parameter.");

    let iterateFunc;
    if (parseInt(startId) < parseInt(endId) || (startId && !endId))
        iterateFunc = iterateMessagesFromTop(channel, startId, endId, count);
    else if (!startId && endId)
        iterateFunc = iterateMessagesFromBottom(channel, endId, startId, count);
    else
        iterateFunc = iterateMessagesFromBottom(channel, startId, endId, count);

    for await (let message of iterateFunc)
        yield message;
}
