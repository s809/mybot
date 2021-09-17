import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import { importCommands } from "../../modules/commands/importHelper.js";

export const name = "channel";
export const managementPermissionLevel = CommandManagementPermissionLevel.SERVER_OWNER;
export const subcommands = await importCommands(import.meta.url);
