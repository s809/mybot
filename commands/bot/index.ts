import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "bot",
    subcommands: await importCommands(import.meta.url),
    usableAsAppCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.UseApplicationCommands
};
export default command;
