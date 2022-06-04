import { Message } from "discord.js";
import { data } from "../env";
import { Command } from "../modules/commands/definitions";
import { Translator } from "../modules/misc/Translator";

function prefix(msg: Message, newPrefix: string) {
    let translator = Translator.get(msg);

    if (!msg.guild)
        return translator.translate("errors.not_in_server");

    data.guilds[msg.guildId].prefix = newPrefix;
}

const command: Command = {
    name: "prefix",
    args: [1, 1, "<newPrefix>"],
    func: prefix,
    managementPermissionLevel: "ManageGuild"
}
export default command;
