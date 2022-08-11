import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { InServer } from "../../modules/commands/requirements";

const command: CommandDefinition = {
    name: "emoji",
    requirements: InServer,
    subcommands: await importCommands(import.meta.url)
};
export default command;
