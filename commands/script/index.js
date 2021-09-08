import { makeSubCommands } from "../../modules/commands/commands.js";
import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import * as create from "./create.js";
import * as _delete from "./delete.js";
import * as list from "./list.js";
import * as run from "./run.js";

export const name = "script";
export const subcommands = makeSubCommands(
    create,
    _delete,
    list,
    run
);
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
