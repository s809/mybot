import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "channel",
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false,
    subcommands: await importCommands(import.meta.url),
    usableAsAppCommand: true
};
export default command;
