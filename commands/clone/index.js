"use strict";

import Discord from "discord.js";
import { pendingClones, client, messageBuffers, channelData } from "../../env.js";
import { makeSubCommands, mentionToChannel, sleep } from "../../util.js";
import { sendWebhookMessage } from "../../sendUtil.js";

import * as stop from "./stop.js";
import iterateMessages from "../../modules/iterateMessages.js";

const errorStrings = {
    sameChannel: "Cannot clone to same channel.",
    alreadyPending: "Clone is already pending.",
    notMirrored: "Channel is not mirrored nor any channel is mirroring to it.",
    invalidArgument: "Invalid argument."
};

/**
 * Clone message from one channel to another.
 * 
 * @param {Discord.Message} msg Message with this command.
 * @param {string} count Amount of messages to clone.
 * @param {Discord.TextChannel} srcChannel Source channel.
 * @param {Discord.TextChannel} destChannel Destination channel.
 * @returns {Promise<boolean>} Whether a command was successfully completed.
 */
async function batchClone(msg, count, srcChannel, destChannel) {
    if (destChannel === srcChannel) {
        await msg.channel.send(errorStrings.sameChannel);
        return false;
    }

    if (count === "all") {
        count = null;
    }
    else {
        count = parseInt(count);
        if (isNaN(count) || count < 1) {
            await msg.channel.send(errorStrings.invalidArgument);
            return false;
        }
    }

    /** @type {Discord.Message} */
    let counter;
    /** @type {Error} */
    let counterError = null;
    /** @type {Promise<Discord.Message>} */
    let counterPromise = null;

    const markCounterUpdated = message => {
        counter = message;
        counterPromise = null;
        return message;
    };
    const markCounterError = e => {
        counterError = e;
    };
    
    counterPromise = msg.channel.send(`Fetching messages...`)
        .then(markCounterUpdated)
        .catch(markCounterError);

    /** @type {Discord.Message[]} */
    let messages = [];
    for await (let message of iterateMessages(srcChannel, "0", null, count))
    {
        if (counterError)
            throw counterError;
        if (!counterPromise)
        {
            counterPromise = counter.edit(`Fetching messages... (${messages.length} fetched)`)
                .then(markCounterUpdated)
                .catch(markCounterError);
        }

        messages.unshift(message);

        // Gives counter a chance to update while a new block is being added to array.
        // Without this line it's updated only when new block is fetched.
        await new Promise(resolve => setImmediate(resolve));
    }

    // Wait and update counter before cloning.
    if (counterPromise)
        await counterPromise;
    if (counterError)
        throw counterError;
    await counter.edit(`${messages.length} messages will be cloned.`);

    messageBuffers.set(srcChannel, messageBuffers.get(srcChannel).concat(messages));

    let webhooks = await destChannel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.name === "ChannelLink");
    let isTemporary = false;

    if (webhook === undefined) {
        webhook = webhooks.find(webhook => webhook.name === "TempChannelLink");
        if (webhook === undefined)
            webhook = await destChannel.createWebhook("TempChannelLink");
        isTemporary = true;
    }

    destChannel.startTyping();
    let initialLength = messages.length;

    let message = messageBuffers.get(srcChannel).pop();
    while (message) {
        if (!pendingClones.has(msg.channel)) {
            destChannel.stopTyping();
            return false;
        }

        await sendWebhookMessage(message, webhook);

        if (initialLength > 500)
            await sleep(2000);

        message = messageBuffers.get(srcChannel).pop();
    }
    destChannel.stopTyping();

    if (isTemporary)
        await webhook.delete();

    return true;
}

/**
 * Clone message from one channel to another.
 * 
 * @param {Discord.Message} msg Message with this command.
 * @param {string} count Amount of messages to clone.
 * @param {Discord.TextChannel} destChannel Destination channel.
 * @returns {Promise<boolean>} Whether a command was successfully completed.
 */
async function batchCloneWrapper(msg, count, destChannel) {
    if (pendingClones.has(msg.channel)) {
        await msg.channel.send(errorStrings.alreadyPending);
        return false;
    }

    let channel;
    if (destChannel === undefined) {
        if (channelData.mappedChannels.has(msg.channel.id)) {
            channel = msg.channel;
        }
        else {
            channel = [...channelData.mappedChannels.entries()].find(entry => entry[1].id === msg.channel.id)[0];
            if (channel) {
                channel = await client.channels.fetch(channel);
            }
            else {
                msg.channel.send(errorStrings.notMirrored);
                return false;
            }
        }

        destChannel = await client.channels.fetch(channelData.mappedChannels.get(channel.id).id);
    }
    else {
        channel = msg.channel;
        destChannel = await client.channels.fetch(mentionToChannel(destChannel));
    }

    try {
        messageBuffers.set(channel, []);
        pendingClones.set(channel, destChannel);
        pendingClones.set(destChannel, channel);
        return await batchClone(msg, count, channel, destChannel);
    }
    finally {
        pendingClones.delete(channel);
        pendingClones.delete(destChannel);
        messageBuffers.delete(channel);
    }
}

export const name = "clone";
export const description = "copy last <count> messages to mirror or defined channel";
export const args = "<count|\"all\"> [channel]";
export const minArgs = 1;
export const maxArgs = 2;
export const func = batchCloneWrapper;
export const subcommands = makeSubCommands(stop);
