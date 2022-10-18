import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "bot",
    subcommands: await importModules(import.meta.url),
    usableAsAppCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.UseApplicationCommands
};
export default command;
