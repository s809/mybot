import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { data } from "../env";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { CommandDefinition } from "../modules/commands/definitions";
import { Translator } from "../modules/misc/Translator";

function prefix(msg: CommandMessage, {
    newPrefix
}: {
    newPrefix: string;
}) {
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
    usableAsAppCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild
}
export default command;
