"use strict";

import { TextChannel } from "discord.js";
import { client } from "../../env.js";
import { isChannelMapped } from "../../modules/data/channelLinking.js";
import { mentionToChannel } from "../../util.js";

async function addMirrorFrom(msg, idArg, isSilentArg) {
    if (isSilentArg !== undefined && isSilentArg !== "silent") {
        msg.channel.send("Invalid argument.");
        return false;
    }

    /** @type {TextChannel} */
    let channel = await client.channels.fetch(mentionToChannel(idArg));

    if (isChannelMapped(channel.guild.id, channel.id)) {
        await msg.channel.send("Cannot mirror from mirror channel.");
        return false;
    }

    if (isChannelMapped(channel.guild.id, msg.channel.id)) {
        await msg.channel.send("This channel is mirrored.");
        return false;
    }

    try {
        if (msg.channel !== channel && isSilentArg === undefined)
            await channel.send(`This channel is mirrored to ${msg.channel}.`);
    }
    catch (e) {
        await msg.channel.send("Cannot access source channel.");
        return false;
    }

    return await (await import("./index.js")).func({
        channel: channel,
        guild: channel.guild
    }, msg.channel.toString());
}

export const name = "from";
export const description = "mirror another channel to this channel";
export const args = "<channel> [\"silent\"]";
export const minArgs = 1;
export const maxArgs = 2;
export const func = addMirrorFrom;
