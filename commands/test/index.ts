import { debug } from "../../constants";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "test",
    ownerOnly: !debug,
    subcommands: await importModules(import.meta.url),
    usableAsAppCommand: debug
};
export default command;
