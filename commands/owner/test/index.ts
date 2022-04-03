import { Command } from "../../../modules/commands/definitions";
import { importCommands } from "../../../modules/commands/importHelper";

const command: Command = {
    name: "test",
    subcommands: await importCommands(import.meta.url)
};
export default command;
