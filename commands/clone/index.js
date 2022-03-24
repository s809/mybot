import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import { importCommands } from "../../modules/commands/importHelper.js";

export const name = "clone";
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
export const subcommands = await importCommands(import.meta.url);
