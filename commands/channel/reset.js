"use strict";

import { channelData } from "../../env.js";

async function resetChannel(msg) {
    if (channelData.mappedChannels.has(msg.channel) || [...channelData.mappedChannels.values()].includes(msg.channel)) {
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
