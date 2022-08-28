import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "textgen",
    usableAsAppCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false,
    subcommands: await importCommands(import.meta.url)
};
export default command;
