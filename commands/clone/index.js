"use strict";

import { pendingClones, client, messageBuffers, channelData } from "../../env.js";
import { clamp, makeSubCommands, mentionToChannel } from "../../util.js";
import { sendWebhookMessage } from "../../sendUtil.js";

import * as stop from "./stop.js";

async function batchClone(msg, countArg, channel, toChannel) {
    if (toChannel === channel) {
        msg.channel.send("Cannot clone to same channel.");
        return false;
    }

    if (countArg !== "all") {
        countArg = parseInt(countArg);
        if (isNaN(countArg) || countArg < 1) {
            msg.channel.send("Invalid argument.");
            return false;
        }
    }

    let messages = [...(await channel.messages.fetch({ limit: (countArg === "all" || countArg > 100) ? 100 : countArg })).values()];
    if ((countArg === "all" && messages.length === 100) || countArg > 100) {
        let addedMessages;
        let reaction = msg.react("??");
        let counter = await msg.channel.send(`Fetching messages... (${messages.length} loaded)`);
        do {
            if (!pendingClones.has(msg.channel)) {
                (await reaction).users.remove(client.user);
                return false;
            }

            addedMessages = await channel.messages.fetch({ before: messages[messages.length - 1].id, limit: countArg === "all" ? 100 : clamp(countArg - messages.length) });
            messages = messages.concat([...addedMessages.values()]);
            await counter.edit(`Fetching messages... (${messages.length} loaded)`);
        }
        while (addedMessages.size === 100);
        (await reaction).users.remove(client.user);
        counter.edit(`${messages.length} messages will be cloned.`);
    }

    messageBuffers.set(channel, messageBuffers.get(channel).concat(messages));

    let webhooks = await toChannel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.name === "ChannelLink");
    let isTemporary = false;

    if (webhook === undefined) {
        webhook = webhooks.find(webhook => webhook.name === "TempCrosspost");
        if (webhook === undefined)
            webhook = await toChannel.createWebhook("TempCrosspost");
        isTemporary = true;
    }

    toChannel.startTyping();
    let initialLength = messages.length;

    let message = messageBuffers.get(channel).pop();
    while (message) {
        if (!pendingClones.has(msg.channel)) {
            toChannel.stopTyping();
            return false;
        }

        await sendWebhookMessage(message, webhook);

        if (initialLength > 500)
            await new Promise(resolve => setTimeout(resolve, 2000 - Date.now() % 2000));

        message = messageBuffers.get(channel).pop();
    }
    toChannel.stopTyping();

    if (isTemporary)
        await webhook.delete();

    return true;
}

async function batchCloneWrapper(msg, countArg, toChannel) {
    if (pendingClones.has(msg.channel)) {
        msg.channel.send("Clone is already pending.");
        return false;
    }

    let channel;
    if (toChannel === undefined) {
        if (channelData.mappedChannels.has(msg.channel.id)) {
            channel = msg.channel;
        }
        else {
            channel = [...channelData.mappedChannels.entries()].find(entry => entry[1].id === msg.channel.id)[0];
            if (channel) {
                channel = await client.channels.fetch(channel);
            }
            else {
                msg.channel.send("Channel is not mirrored nor any channel is mirroring to it.");
                return false;
            }
        }

        toChannel = await client.channels.fetch(channelData.mappedChannels.get(channel.id).id);
    }
    else {
        channel = msg.channel;
        toChannel = await client.channels.fetch(mentionToChannel(toChannel));
    }

    try {
        messageBuffers.set(channel, []);
        pendingClones.set(channel, toChannel);
        pendingClones.set(toChannel, channel);
        return await batchClone(msg, countArg, channel, toChannel);
    }
    finally {
        pendingClones.delete(channel);
        pendingClones.delete(toChannel);
        messageBuffers.delete(channel);
    }
}

export const name = "clone";
export const description = "copy last <count> messages to mirror or defined channel";
export const args = "<count[/all]> [channel]";
export const minArgs = 1;
export const maxArgs = 2;
export const func = batchCloneWrapper;
export const subcommands = makeSubCommands(stop);
