"use strict";

import { client, channelData, pendingClones, messageBuffers } from "../env.js";
import { sendWebhookMessageAuto } from "../sendUtil.js";

export default async function cloneChannel(_channel, lastMessage) {
    let channel = await client.channels.fetch(_channel);
    let toChannel = await client.channels.fetch(channelData.mappedChannels.get(_channel).id);

    if (!channel.messages || !(channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]))) return;

    pendingClones.set(channel, toChannel);
    pendingClones.set(toChannel, channel);
    messageBuffers.set(channel, []);

    let messages = [...(await channel.messages.fetch({ after: lastMessage, limit: 100 })).values()];

    if (messages.length === 100) {
        let addedMessages;
        do {
            addedMessages = await channel.messages.fetch({ after: messages[0].id, limit: 100 });
            messages = [...addedMessages.values()].concat(messages);
        }
        while (addedMessages.size === 100);
    }

    messageBuffers.set(channel, messageBuffers.get(channel).concat(messages));

    while (messageBuffers.get(channel).length > 0) {
        let message = messageBuffers.get(channel).pop();
        await sendWebhookMessageAuto(message);
    }

    pendingClones.delete(channel);
    pendingClones.delete(toChannel);
    messageBuffers.delete(channel);

    return messages.length;
}
