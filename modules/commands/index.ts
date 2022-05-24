/**
 * @file Module for importing all commands.
 */

import { pathToFileURL } from "url";
import { botDirectory } from "../../env";
import { importCommands } from "./importHelper";
import { Command } from "./definitions";
import { Message } from "discord.js";
import { getPrefix } from "../data/getPrefix";

var commands: Map<string, Command>;

function prepareSubcommands(list: Map<string, Command>, inheritedOptions?: any) {
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
 * @param path Path to command.
 * @param allowPartialResolve Whether to allow resolving to closest match.
 * @returns Command, if it was found.
 */
export function resolveCommand(path: string | string[], allowPartialResolve: boolean = false): Command | null {
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
 */
export function getRootCommands(): Command[] {
    return [...commands.values()];
}

/**
 * Recursively iterates map of with commands.
 * 
 * @param list List of commands to iterate.
 */
function* iterateSubcommands(list: Map<string, Command>): Iterable<Command> {
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
 */
export function* iterateCommands() {
    for (let command of iterateSubcommands(commands))
        yield command;
}

/**
 * Converts a command into an usage string.
 * 
 * @param msg Context message.
 * @param command Command which usage needs to be printed.
 * @returns Usage string of a command.
 */
export function toUsageString(msg: Message, command: Command) {
    return `${getPrefix(msg.guildId)}${command.path.replaceAll("/", " ")} ${command.args?.[2] ?? ""}`
}
