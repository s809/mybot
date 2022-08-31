/**
 * @file Owner commands.
 */

import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "owner",
    ownerOnly: true,
    subcommands: await importCommands(import.meta.url)
};
export default command;
