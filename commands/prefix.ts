import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild } from "../database/models";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { CommandDefinition } from "../modules/commands/definitions";

async function prefix(msg: CommandMessage<true>, {
    newPrefix
}: {
    newPrefix: string;
}) {
    await Guild.findByIdOrDefaultAndUpdate(msg.guildId, { prefix: newPrefix });
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
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    allowDMs: false
}
export default command;
