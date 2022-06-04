import { Command } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: Command = {
    name: "server",
    managementPermissionLevel: "BotOwner",
    subcommands: await importCommands(import.meta.url)
};
export default command;
