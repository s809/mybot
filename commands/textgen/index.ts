import { Command } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: Command = {
    name: "textgen",
    managementPermissionLevel: "MANAGE_CHANNELS",
    subcommands: await importCommands(import.meta.url)
};
export default command;
