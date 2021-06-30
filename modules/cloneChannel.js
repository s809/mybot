"use strict";

const env = require("../env");
const sendUtil = require("../sendUtil");

async function cloneChannel(_channel, lastMessage) {
    let channel = await env.client.channels.fetch(_channel);
    let toChannel = await env.client.channels.fetch(env.channelData.mappedChannels.get(_channel).id);

    if (!channel.messages || !(channel.permissionsFor(env.client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]))) return;

    env.pendingClones.set(channel, toChannel);
    env.pendingClones.set(toChannel, channel);
    env.messageBuffers.set(channel, []);

    let messages = [...(await channel.messages.fetch({ after: lastMessage, limit: 100 })).values()];

    if (messages.length === 100) {
        let addedMessages;
        do {
            addedMessages = await channel.messages.fetch({ after: messages[0].id, limit: 100 });
            messages = [...addedMessages.values()].concat(messages);
        }
        while (addedMessages.size === 100);
    }

    env.messageBuffers.set(channel, env.messageBuffers.get(channel).concat(messages));

    while (env.messageBuffers.get(channel).length > 0) {
        let message = env.messageBuffers.get(channel).pop();
        await sendUtil.sendWebhookMessageAuto(message);
    }

    env.pendingClones.delete(channel);
    env.pendingClones.delete(toChannel);
    env.messageBuffers.delete(channel);

    return messages.length;
}

module.exports = cloneChannel;
