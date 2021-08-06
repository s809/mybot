"use strict";

import { mentionToChannel, makeSubCommands } from "../../util.js";
import { client, data } from "../../env.js";

import * as from from "./from.js";
import * as remove from "./remove.js";
import { isChannelMapped } from "../../modules/mappedChannels.js";
import { Message } from "discord.js";

/**
 * @param {Message} msg
 * @param {string} idArg
 */
async function mirror(msg, idArg) {
    let channel = await client.channels.fetch(mentionToChannel(idArg));

    if (isChannelMapped(channel.guild.id, channel.id)) {
        await msg.channel.send("Channel is already mirrored.");
        return false;
    }

    if (isChannelMapped(channel.guild.id, msg.channel.id)) {
        await msg.channel.send("Cannot mirror to mirror channel.");
        return false;
    }

    let messages = await msg.channel.messages.fetch();
    let mappedChannels = data.guilds[msg.guild.id].mappedChannels;

    /** @type {import("../../modules/mappedChannels.js").MappedChannel} */
    let mappedChannel = {
        id: channel.id,
        lastMessageId: messages.size > 0 ? messages.first().id : "0"
    };
    mappedChannels[msg.channel.id] = mappedChannel;

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
