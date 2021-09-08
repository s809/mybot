"use strict";

import { Message } from "discord.js";
import { isChannelMapped } from "../../modules/data/mappedChannels.js";

/**
 * @param {Message} msg
 */
async function resetChannel(msg) {
    if (isChannelMapped(msg.guild.id, msg.channel.id)) {
        await msg.channel.send("Unmirror channel first.");
        return false;
    }

    await Promise.all([
        (async () => {
            let channel = await msg.channel.clone();
            await channel.setPosition(msg.channel.position);
        })(),
        msg.channel.delete()
    ]);
    
    return true;
}

export const name = "reset";
export const description = "clone and delete this channel";
export const minArgs = 0;
export const maxArgs = 0;
export const func = resetChannel;
