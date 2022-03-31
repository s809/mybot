import { GuildChannel, Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { isChannelLinked } from "../../modules/data/channelLinking";
import { Translator } from "../../modules/misc/Translator";

async function resetChannel(msg: Message) {
    let translator = Translator.get(msg);

    if (!(msg.channel instanceof GuildChannel))
        return translator.translate("errors.not_in_server");

    if (isChannelLinked(msg.guild.id, msg.channel.id))
        return translator.translate("errors.channel_needs_unlink");

    let position = msg.channel.position;
    await Promise.all([
        msg.channel.clone().then(channel => {
            channel.setPosition(position)
        }),
        msg.channel.delete()
    ]);
}

const command: Command = {
    name: "reset",
    func: resetChannel
};
export default command;
