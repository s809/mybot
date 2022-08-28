import { GuildChannel } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function resetChannel(msg: CommandMessage) {
    let translator = Translator.getOrDefault(msg);

    if (!(msg.channel instanceof GuildChannel))
        return translator.translate("errors.not_in_server");

    let position = msg.channel.position;
    await Promise.all([
        msg.channel.clone().then(channel => {
            channel.setPosition(position)
        }),
        msg.channel.delete()
    ]);
}

const command: CommandDefinition = {
    key: "reset",
    handler: resetChannel
};
export default command;
