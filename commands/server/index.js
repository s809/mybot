import { makeSubCommands } from "../../modules/commands/commands.js";
import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import * as clone from "./clone.js";
import * as create from "./create.js";
import * as delall from "./delall.js";
import * as _delete from "./delete.js";

export const name = "server";
export const subcommands = makeSubCommands(
    clone,
    create,
    delall,
    _delete
);
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
