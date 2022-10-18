import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "channel",
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false,
    subcommands: await importModules(import.meta.url),
    usableAsAppCommand: true
};
export default command;
