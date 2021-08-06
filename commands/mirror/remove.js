"use strict";

import { TextChannel } from "discord.js";
import { data, client } from "../../env.js";
import { getMappedChannel, getMappedChannelByDest } from "../../modules/mappedChannels.js";

async function removeMirror(msg) {
    /** @type {TextChannel} */
    let channel;
    /** @type {TextChannel} */
    let fromChannel = msg.channel;
    let mappedChannels = data.guilds[msg.guild.id].mappedChannels;

    if (fromChannel.id in mappedChannels) {
        channel = await client.channels.fetch(getMappedChannel(msg.guild.id, fromChannel.id).id);
    }
    else {
        channel = getMappedChannelByDest(msg.guild.id, fromChannel.id);
        if (channel) {
            let tmp = fromChannel;
            fromChannel = await client.channels.fetch(channel[0]);
            channel = tmp;
        }
        else {
            await msg.channel.send("Channel is not mirrored nor any channel is mirroring to it.");
            return false;
        }
    }

    let webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.name === "ChannelLink");

    if (webhook !== undefined)
        await webhook.delete();
    delete mappedChannels[fromChannel.id];

    if (fromChannel !== channel)
        await channel.send(`${fromChannel} is no longer mirrored.`);

    return true;
}

export const name = "remove";
export const description = "stop mirroring to/from this channel";
export const minArgs = 0;
export const maxArgs = 0;
export const func = removeMirror;
