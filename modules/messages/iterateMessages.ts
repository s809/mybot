/**
 * @file Provides functions for iterating by messages.
 */

import { Snowflake, TextBasedChannel } from "discord.js";

const maxFetchMessages = 100;

/**
 * Iterates messages, top-to-bottom.
 * 
 * @param channel Channel to iterate messages from.
 * @param oldestId Iteration start ID.
 * @param latestId Iteration end ID.
 * @param count Amount of messages to iterate.
 * @yields Messages from a channel.
 */
async function* iterateMessagesFromTop(channel: TextBasedChannel, oldestId: Snowflake | null, latestId: Snowflake | null, count: number | null) {
    let firstMessageId = oldestId ?? "0";

    // eslint-disable-next-line no-unmodified-loop-condition
    for (let collectedCount = 0; collectedCount < count || count === null; collectedCount += maxFetchMessages) {
        if (count === null)
            collectedCount = -maxFetchMessages;

        let fetchCount = Math.min(count - collectedCount, maxFetchMessages);

        let messages = [...(await channel.messages.fetch({
            after: firstMessageId,
            limit: fetchCount
        })).values()];
        if (!messages.length) return;

        firstMessageId = messages[0].id;

        for (let message of messages.reverse()) {
            if (BigInt(message.id) > BigInt(latestId ?? channel.lastMessageId) + 1n) return;
            yield message;
        }

        if (messages.length < maxFetchMessages) return;
    }
}

/**
 * Iterates messages, bottom-to-top.
 * 
 * @param channel Channel to iterate messages from.
 * @param latestId Iteration start ID.
 * @param oldestId Iteration end ID.
 * @param count Amount of messages to iterate.
 * @yields Messages from a channel.
 */
async function* iterateMessagesFromBottom(channel: TextBasedChannel, latestId: Snowflake | null, oldestId: Snowflake | null, count: number | null) {
    let lastMessageId = (BigInt(latestId ?? channel.lastMessageId) + 1n).toString();

    // eslint-disable-next-line no-unmodified-loop-condition
    for (let collectedCount = 0; collectedCount < count || count === null; collectedCount += maxFetchMessages) {
        if (count === null)
            collectedCount = -maxFetchMessages;

        let fetchCount = Math.min(count - collectedCount, maxFetchMessages);

        let messages = [...(await channel.messages.fetch({
            before: lastMessageId,
            limit: fetchCount
        })).values()];
        if (!messages.length) return;

        lastMessageId = messages[messages.length - 1].id;

        for (let message of messages) {
            if (BigInt(message.id) <= BigInt(oldestId ?? "0")) return;
            yield message;
        }

        if (messages.length < maxFetchMessages) return;
    }
}

/**
 * Iterate through messages.
 * 
 * | Arguments                       | Direction     |
 * | :--------------------           | :------------ |
 * | None                            | bottom-to-top |
 * | {@link startId} only            | top-to-bottom |
 * | {@link endId} only              | bottom-to-top |
 * | {@link startId} < {@link endId} | top-to-bottom |
 * | {@link startId} > {@link endId} | bottom-to-top |
 * 
 * @param channel Channel to iterate messages from.
 * @param startId ID before first message in iteration.
 * @param endId ID of last message in iteration.
 * @param count Amount of messages to iterate.
 * @yields Messages from a channel.
 */
export default async function* iterateMessages(channel: TextBasedChannel, startId: Snowflake | null = null, endId: Snowflake | null = null, count: number | null = null) {
    if (count !== null && (typeof count !== "number" || count < 1))
        throw new Error("Invalid count parameter.");

    let iterable;
    if (BigInt(startId ?? 0) < BigInt(endId ?? channel.lastMessageId) + 1n || (startId && !endId))
        iterable = iterateMessagesFromTop(channel, startId, endId, count);
    else if (!startId && endId)
        iterable = iterateMessagesFromBottom(channel, endId, startId, count);
    else
        iterable = iterateMessagesFromBottom(channel, startId, endId, count);

    let message;
    try {
        for await (message of iterable)
            yield message;
    }
    catch (e) {
        e.message += `\nMessage: ${message?.url}`;
        throw e;
    }
}
