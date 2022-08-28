import { debug } from "../../env";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { BotOwner } from "../../modules/commands/requirements";

const command: CommandDefinition = {
    key: "test",
    requirements: BotOwner,
    subcommands: await importCommands(import.meta.url),
    usableAsAppCommand: debug
};
export default command;
