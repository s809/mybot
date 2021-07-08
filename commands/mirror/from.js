"use strict";

import { client, channelData } from "../../env.js";
import { mentionToChannel } from "../../util.js";

async function addMirrorFrom(msg, idArg, isSilentArg) {
    if (isSilentArg !== undefined && isSilentArg !== "silent") {
        msg.channel.send("Invalid argument.");
        return false;
    }

    let channel = await client.channels.fetch(mentionToChannel(idArg));

    if (channelData.mappedChannels.has(channel.id)) {
        msg.channel.send("Channel is already mirrored.");
        return false;
    }

    if ([...channelData.mappedChannels.values()].includes(channel.id)) {
        msg.channel.send("Cannot mirror destination channel.");
        return false;
    }

    if (channelData.mappedChannels.has(msg.channel.id)) {
        msg.channel.send("Cannot mirror to mirrored channel.");
        return false;
    }

    try {
        if (msg.channel !== channel && isSilentArg === undefined)
            channel.send(`This channel is mirrored to ${msg.channel}.`);
    }
    catch (e) {
        msg.channel.send("Cannot access source channel.");
        return false;
    }

    return await require("../mirror.js").func({ channel: channel }, msg.channel.toString());
}

export const name = "from";
export const description = "mirror another channel to this channel";
export const args = "<channel> [\"silent\"]";
export const minArgs = 1;
export const maxArgs = 2;
export const func = addMirrorFrom;
