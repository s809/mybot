"use strict";

const env = require("../env.js");
const util = require("../util.js");
const sendUtil = require("../sendUtil.js");

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
            if (!env.pendingClones.has(msg.channel)) {
                (await reaction).users.remove(env.client.user);
                return false;
            }

            addedMessages = await channel.messages.fetch({ before: messages[messages.length - 1].id, limit: countArg === "all" ? 100 : util.clamp(countArg - messages.length) });
            messages = messages.concat([...addedMessages.values()]);
            await counter.edit(`Fetching messages... (${messages.length} loaded)`);
        }
        while (addedMessages.size === 100);
        (await reaction).users.remove(env.client.user);
        counter.edit(`${messages.length} messages will be cloned.`);
    }

    env.messageBuffers.set(channel, env.messageBuffers.get(channel).concat(messages));

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

    let message = env.messageBuffers.get(channel).pop();
    while (message) {
        if (!env.pendingClones.has(msg.channel)) {
            toChannel.stopTyping();
            return false;
        }

        await sendUtil.sendWebhookMessage(message, webhook);

        if (initialLength > 500)
            await new Promise(resolve => setTimeout(resolve, 2000 - Date.now() % 2000));

        message = env.messageBuffers.get(channel).pop();
    }
    toChannel.stopTyping();

    if (isTemporary)
        await webhook.delete();

    return true;
}

async function batchCloneWrapper(msg, countArg, toChannel) {
    if (env.pendingClones.has(msg.channel)) {
        msg.channel.send("Clone is already pending.");
        return false;
    }

    let channel;
    if (toChannel === undefined) {
        if (env.channelData.mappedChannels.has(msg.channel.id)) {
            channel = msg.channel;
        }
        else {
            channel = [...env.channelData.mappedChannels.entries()].find(entry => entry[1].id === msg.channel.id)[0];
            if (channel) {
                channel = await env.client.channels.fetch(channel);
            }
            else {
                msg.channel.send("Channel is not mirrored nor any channel is mirroring to it.");
                return false;
            }
        }

        toChannel = await env.client.channels.fetch(env.channelData.mappedChannels.get(channel.id).id);
    }
    else {
        channel = msg.channel;
        toChannel = await env.client.channels.fetch(util.mentionToChannel(toChannel));
    }

    try {
        env.messageBuffers.set(channel, []);
        env.pendingClones.set(channel, toChannel);
        env.pendingClones.set(toChannel, channel);
        return await batchClone(msg, countArg, channel, toChannel);
    }
    finally {
        env.pendingClones.delete(channel);
        env.pendingClones.delete(toChannel);
        env.messageBuffers.delete(channel);
    }
}

module.exports =
{
    name: "clone",
    description: "copy last <count> messages to mirror or defined channel",
    args: "<count/all> <(optional)channel>",
    minArgs: 1,
    maxArgs: 2,
    func: batchCloneWrapper,
    subcommands: require("../requireHelper.js")("./commands/clone"),
}
