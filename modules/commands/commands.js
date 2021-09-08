/**
 * @file Module for importing all commands.
 */

import * as bot from "../../commands/bot/index.js";
import * as channel from "../../commands/channel/index.js";
import * as clone from "../../commands/clone/index.js";
import * as mirror from "../../commands/mirror/index.js";
import * as music from "../../commands/music/index.js";
import * as owner from "../../commands/owner/index.js";
import * as permission from "../../commands/permission/index.js";
import * as script from "../../commands/script/index.js";
import * as server from "../../commands/server/index.js";

import * as delrange from "../../commands/delrange.js";
import * as timer from "../../commands/timer.js";

import * as help from "../../commands/help.js";

/**
 * Wraps command objects into map with subcommands.
 * 
 * @param {...Command} args Commands to be wrapped.
 * @returns {Map<string, Command>} Map containing wrapped commands.
 */
export function makeSubCommands(...args) {
    let map = new Map();

    for (let arg of args)
        map.set(arg.name, arg);

    return map;
}

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

/**
 * Resolves command by its path.
 * 
 * @param {string | string[]} path Path to command.
 * @param {boolean} allowPartialResolve Whether to allow resolving to closest match.
 * @returns {import("../../util.js").Command?} Command, if it was found.
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
 * Recursively iterates map of with commands.
 * 
 * @param {Map<string, Command>} list List of commands to iterate.
 * @param {{path?: string, managementPermissionLevel?: CommandManagementPermissionLevel}} inheritedOptions Options inherited from parent command.
 * @yields {}
 */
function* iterateSubcommands(list, inheritedOptions) {
    for (let command of list.values()) {
        let path = inheritedOptions?.path
            ? `${inheritedOptions.path}/${command.name}`
            : command.name;

        let options = {
            ...inheritedOptions,
            path: path
        };
        if (command.managementPermissionLevel)
            options.managementPermissionLevel = command.managementPermissionLevel;
        
        yield {
            ...options,
            ...command
        };

        if (command.subcommands) {
            for (let subcommand of iterateSubcommands(command.subcommands, options))
                yield subcommand;
        }
    }
}

/**
 * Recursively iterates commands.
 * 
 * @yields {Command}
 */
export function* iterateCommands() {
    for (let command of iterateSubcommands(commands)) {
        yield command;
    }
}
