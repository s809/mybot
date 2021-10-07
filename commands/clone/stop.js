import { Message } from "discord.js";
import { ChannelLinkRole, getLinkedChannel } from "../../modules/data/channelLinking.js";
import { isCopying, stopCopying } from "../../modules/messages/messageCopying.js";

/**
 * 
 * @param {Message} msg
 * @returns
 */
async function stopBatchClone(msg) {
    let link = getLinkedChannel(msg.guildId, msg.channelId);

    if (!isCopying(link.channelId))
        return "Clone is not pending.";

    stopCopying(link.role === ChannelLinkRole.DESTINATION ? msg.channelId : link.channelId);
}

export const name = "stop";
export const description = "stop pending clone operation";
export const func = stopBatchClone;
