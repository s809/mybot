import { Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { getLinkedChannel } from "../../modules/data/channelLinking";
import { isCopying, stopCopying } from "../../modules/messages/messageCopying";
import { Translator } from "../../modules/misc/Translator";

async function stopBatchClone(msg: Message) {
    let link = getLinkedChannel(msg.guildId, msg.channelId);

    if (!isCopying(link.channelId))
        return Translator.get(msg).translate("errors.clone_not_pending");

    stopCopying(link.role === "DESTINATION" ? msg.channelId : link.channelId);
}

const command: Command = {
    name: "stop",
    func: stopBatchClone,
    managementPermissionLevel: "BOT_OWNER"
};
export default command;
