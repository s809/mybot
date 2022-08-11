import { Message, PermissionFlagsBits } from "discord.js";
import { data } from "../env";
import { Command } from "../modules/commands/definitions";
import { ServerPermissions } from "../modules/commands/requirements";
import { Translator } from "../modules/misc/Translator";

function prefix(msg: Message, newPrefix: string) {
    let translator = Translator.getOrDefault(msg);

    if (!msg.guildId)
        return translator.translate("errors.not_in_server");

    data.guilds[msg.guildId].prefix = newPrefix;
}

const command: Command = {
    name: "prefix",
    args: [1, 1, "<newPrefix>"],
    func: prefix,
    requirements: ServerPermissions(PermissionFlagsBits.ManageGuild)
}
export default command;
