/**
 * @file Owner commands.
 */

import { makeSubCommands } from "../../modules/commands/commands.js";
import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";

import * as evalMode from "./evalmode.js";
import * as restart from "./restart.js";
import * as setupReceiverServer from "./setupreceiverserver.js";
import * as shell from "./shell.js";
import * as test from "./test.js";
import * as testToken from "./testToken.js";

export const name = "owner";
export const subcommands = makeSubCommands(
    evalMode,
    restart,
    setupReceiverServer,
    shell,
    test,
    testToken
);
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
