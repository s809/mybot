import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { ServerPermissions } from "../../modules/commands/requirements";

const command: CommandDefinition = {
    name: "textgen",
    requirements: ServerPermissions(PermissionFlagsBits.ManageChannels),
    subcommands: await importCommands(import.meta.url)
};
export default command;
