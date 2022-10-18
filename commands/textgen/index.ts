import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "textgen",
    usableAsAppCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false,
    subcommands: await importModules(import.meta.url)
};
export default command;
