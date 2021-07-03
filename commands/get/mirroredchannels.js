"use strict";

import { channelData, client } from "../../env.js";

async function getMirroredChannels(msg) {
    let resp = "";

    for (let mirror of channelData.mappedChannels.entries()) {
        let fromChannel = await client.channels.fetch(mirror[0]);
        let toChannel = await client.channels.fetch(mirror[1].id);

        if (fromChannel.guild === msg.guild ||
            toChannel.guild === msg.guild) {
            resp += `${fromChannel} (${fromChannel.guild}) => ${toChannel} (${toChannel.guild})\n`;
        }
    }

    if (resp !== "")
        await msg.channel.send(resp);

    return true;
}

export const name = "mirroredchannels";
export const description = "get channel mirrors for this server";
export const minArgs = 0;
export const maxArgs = 0;
export const func = getMirroredChannels;
