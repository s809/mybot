import { BaseGuildTextChannel, Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { isChannelLinked, unlinkChannel } from "../../modules/data/channelLinking";
import { Translator } from "../../modules/misc/Translator";

async function removeMirror(msg: Message) {
    let translator = Translator.get(msg);

    if (!(msg.channel instanceof BaseGuildTextChannel))
        return translator.translate("errors.not_in_server")

    if (!isChannelLinked(msg.guildId, msg.channelId))
        return translator.translate("errors.channel_not_linked");

    unlinkChannel(msg.channel);
}

const command: Command = {
    name: "remove",
    func: removeMirror
};
export default command;
