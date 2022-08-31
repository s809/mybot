import { debug } from "../../env";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "test",
    ownerOnly: !debug,
    subcommands: await importCommands(import.meta.url),
    usableAsAppCommand: debug
};
export default command;
