import { importCommands } from "../../modules/commands/importHelper";
import { Command } from "../../modules/commands/definitions";

const command: Command = {
    name: "music",
    subcommands: await importCommands(import.meta.url)
};
export default command;
