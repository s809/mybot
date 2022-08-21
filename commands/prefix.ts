import { ApplicationCommandOptionType, Message, PermissionFlagsBits } from "discord.js";
import { data } from "../env";
import { CommandMessage } from "../modules/commands/appCommands";
import { CommandDefinition } from "../modules/commands/definitions";
import { ServerPermissions } from "../modules/commands/requirements";
import { Translator } from "../modules/misc/Translator";

function prefix(msg: CommandMessage, newPrefix: string) {
    let translator = Translator.getOrDefault(msg);

    if (!msg.guildId)
        return translator.translate("errors.not_in_server");

    data.guilds[msg.guildId].prefix = newPrefix;
}

const command: CommandDefinition = {
    key: "prefix",
    args: [{
        translationKey: "newPrefix",
        type: ApplicationCommandOptionType.String,
    }],
    handler: prefix,
    alwaysReactOnSuccess: true,
    requirements: ServerPermissions(PermissionFlagsBits.ManageGuild)
}
export default command;
