import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { BotOwner } from "../../modules/commands/requirements";

const command: CommandDefinition = {
    name: "script",
    requirements: BotOwner,
    subcommands: await importCommands(import.meta.url)
};
export default command;
