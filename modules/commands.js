/**
 * @file Module for importing all commands.
 */

import { CommandManagementPermissionLevel, makeSubCommands } from "../util.js";

import * as bot from "../commands/bot/index.js";
import * as channel from "../commands/channel/index.js";
import * as clone from "../commands/clone/index.js";
import * as mirror from "../commands/mirror/index.js";
import * as music from "../commands/music/index.js";
import * as owner from "../commands/owner/index.js";
import * as permission from "../commands/permission/index.js";
import * as script from "../commands/script/index.js";
import * as server from "../commands/server/index.js";

import * as delrange from "../commands/delrange.js";
import * as timer from "../commands/timer.js";

import * as help from "../commands/help.js";

const commands = makeSubCommands(
    bot,
    channel,
    clone,
    mirror,
    music,
    owner,
    permission,
    script,
    server,

    delrange,
    timer,

    help,
);
export default commands;

/**
 * Resolves command by its path.
 * 
 * @param {string | string[]} path Path to command.
 * @param {boolean} allowPartialResolve Whether to allow resolving to closest match.
 * @returns {import("../util.js").Command?} Command, if it was found.
 */
export function resolveCommand(path, allowPartialResolve = false) {
    if (!Array.isArray(path))
        path = path.split("/");

    let command;
    let list = commands;
    let commandPath, managementPermissionLevel;

    do {
        let found = list.get(path[0]);
        if (!found) break;

        command = found;

        if (command.managementPermissionLevel)
            managementPermissionLevel = command.managementPermissionLevel;

        if (commandPath)
            commandPath += `/${command.name}`;
        else
            commandPath = command.name;

        list = command.subcommands;
        path.shift();
    } while (list);

    if (!allowPartialResolve && path.length)
        return null;

    return command !== undefined
        ? {
            path: commandPath,
            managementPermissionLevel: managementPermissionLevel,
            ...command
        }
        : null;
}

/**
 * @param {import("../util.js").Command} command
 * @param {{path?: string, managementPermissionLevel?: CommandManagementPermissionLevel}} options
 */
function* iterateSubcommands(command, options = {}) {
    let path = options.path
        ? `${options.path}/${command.name}`
        : command.name;

    yield {
        ...options,
        path: path,
        ...command
    };

    if (command.managementPermissionLevel)
        options.managementPermissionLevel = command.managementPermissionLevel;

    if (!command.subcommands) return;
    for (let subcommand of command.subcommands.values()) {
        for (let cmd of iterateSubcommands(subcommand, {
            ...options,
            path: path,
            ...subcommand
        }))
            yield cmd;
    }
}


export function* iterateCommands() {
    for (let command of commands.values()) {
        for (let subcommand of iterateSubcommands(command))
            yield subcommand;
    }
}
