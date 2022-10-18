import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "server",
    ownerOnly: true,
    subcommands: await importModules(import.meta.url)
};
export default command;
