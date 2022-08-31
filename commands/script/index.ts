import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "script",
    ownerOnly: true,
    subcommands: await importCommands(import.meta.url)
};
export default command;
