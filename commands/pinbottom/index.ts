import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "pinbottom",
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    allowDMs: false,
    subcommands: await importModules(import.meta.url),
    usableAsAppCommand: true
};
export default command;
