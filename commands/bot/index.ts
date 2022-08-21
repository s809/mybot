import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "bot",
    subcommands: await importCommands(import.meta.url),
    //usableAsAppCommand: true
};
export default command;
