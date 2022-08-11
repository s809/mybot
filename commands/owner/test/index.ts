import { CommandDefinition } from "../../../modules/commands/definitions";
import { importCommands } from "../../../modules/commands/importHelper";

const command: CommandDefinition = {
    name: "test",
    subcommands: await importCommands(import.meta.url)
};
export default command;
