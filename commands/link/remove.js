import { isChannelLinked, unlinkChannel } from "../../modules/data/channelLinking.js";

async function removeMirror(msg) {
    if (!isChannelLinked(msg.guildId, msg.channelId))
        return "Channel is not mirrored nor any channel is mirroring to it.";

    unlinkChannel(msg.channel);
    return true;
}

export const name = "remove";
export const description = "remove link to/from this channel";
export const minArgs = 0;
export const maxArgs = 0;
export const func = removeMirror;
