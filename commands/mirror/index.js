"use strict";

import { mentionToChannel, makeSubCommands } from "../../util.js";
import { client, channelData } from "../../env.js";

import * as from from "./from.js";
import * as remove from "./remove.js";

async function mirror(msg, idArg) {
    let channel = await client.channels.fetch(mentionToChannel(idArg));

    if (channelData.mappedChannels.has(msg.channel.id)) {
        await msg.channel.send("Channel is already mirrored.");
        return false;
    }

    if ([...channelData.mappedChannels.values()].includes(msg.channel.id)) {
        await msg.channel.send("Cannot mirror destination channel.");
        return false;
    }

    if (channelData.mappedChannels.has(channel.id)) {
        await msg.channel.send("Cannot mirror to mirrored channel.");
        return false;
    }

    await channelData.mapChannel(msg.channel, channel);

    let messages = await msg.channel.messages.fetch();
    if (messages.size > 0)
        await channelData.updateLastMessage(msg.channel, messages.first());

    if (msg.channel !== channel)
        await channel.send(`${msg.channel} is mirrored here.`);

    return true;
}

export const name = "mirror";
export const description = "mirror this channel to another channel";
export const args = "<channel>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = mirror;
export const subcommands = makeSubCommands(from, remove);
