import { makeSubCommands } from "../../modules/commands/commands.js";
import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import * as reset from "./reset.js";
import * as scan from "./scan.js";

export const name = "channel";
export const subcommands = makeSubCommands(
    reset,
    scan
);
export const managementPermissionLevel = CommandManagementPermissionLevel.SERVER_OWNER;
