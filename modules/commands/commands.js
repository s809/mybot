/**
 * @file Module for importing all commands.
 */

import { pathToFileURL } from "url";
import { botDirectory } from "../../env.js";
import { importCommands } from "./importHelper.js";

/**
 * @typedef {import("./definitions.js").Command} Command
 * @private
 */

/** @type {Map<string, Command>} */
var commands;

/**
 * Prepares inner properties of commands.
 * 
 * @param {Map<string, Command>} list List of commands to prepare.
 * @param {*} inheritedOptions Options inherited from parent command
 */
function prepareSubcommands(list, inheritedOptions) {
    if (!list) return;

    for (let command of list.values()) {
        let path = inheritedOptions?.path
            ? `${inheritedOptions.path}/${command.name}`
            : command.name;

        let options = {
            ...inheritedOptions,
            path: path
        };

        command.path = path;
        if (command.managementPermissionLevel)
            options.managementPermissionLevel = command.managementPermissionLevel;
        if (options.managementPermissionLevel && !command.managementPermissionLevel)
            command.managementPermissionLevel = options.managementPermissionLevel;

        prepareSubcommands(command.subcommands, options);
    }
}

/**
 * Loads commands to internal cache.
 */
export async function loadCommands() {
    commands ??= await importCommands(pathToFileURL(botDirectory + "/commands/foo").toString());
    prepareSubcommands(commands);
}

/**
 * Resolves command by its path.
 * 
 * @param {string | string[]} path Path to command.
 * @param {boolean} allowPartialResolve Whether to allow resolving to closest match.
 * @returns {Command?} Command, if it was found.
 */
export function resolveCommand(path, allowPartialResolve = false) {
    if (!Array.isArray(path))
        path = path.split("/");

    let command;
    let list = commands;
    do {
        let found = list.get(path[0]);
        if (!found) break;

        command = found;

        list = command.subcommands;
        path.shift();
    } while (list);

    if (!allowPartialResolve && path.length)
        return null;

    return command ?? null;
}

/**
 * Returns a list with root commands.
 * 
 * @returns {Command[]}
 */
export function getRootCommands() {
    return [...commands.values()];
}

/**
 * Recursively iterates map of with commands.
 * 
 * @param {Map<string, Command>} list List of commands to iterate.
 * @yields
 */
function* iterateSubcommands(list) {
    for (let command of list.values()) {
        yield command;

        if (command.subcommands) {
            for (let subcommand of iterateSubcommands(command.subcommands))
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
