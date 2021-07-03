"use strict";

import { channelData, client } from "../../env.js";

async function removeMirror(msg) {
    let channel, fromChannel = msg.channel;
    if (channelData.mappedChannels.has(fromChannel.id)) {
        channel = await client.channels.fetch(channelData.mappedChannels.get(fromChannel.id).id);
    }
    else {
        channel = [...channelData.mappedChannels.entries()].find(entry => entry[1].id === fromChannel.id);
        if (channel) {
            let tmp = fromChannel;
            fromChannel = await client.channels.fetch(channel[0]);
            channel = tmp;
        }
        else {
            msg.channel.send("Channel is not mirrored nor any channel is mirroring to it.");
            return false;
        }
    }

    let webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.name === "ChannelLink");

    if (webhook !== undefined) webhook.delete();
    await channelData.unmapChannel(fromChannel);

    if (fromChannel !== channel) channel.send(`${fromChannel} is no longer mirrored.`);

    return true;
}

export const name = "remove";
export const description = "stop mirroring to/from this channel";
export const minArgs = 0;
export const maxArgs = 0;
export const func = removeMirror;
