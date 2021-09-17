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

var commands;

/**
 * Loads commands to internal cache.
 */
export async function loadCommands() {
    commands ??= await importCommands(pathToFileURL(botDirectory + "/commands/foo").toString());
}

export const makeSubCommands = () => undefined;

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
