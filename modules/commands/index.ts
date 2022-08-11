/**
 * @file Module for importing all commands.
 */

import { pathToFileURL } from "url";
import { botDirectory } from "../../env";
import { importCommands } from "./importHelper";
import { Command, CommandDefinition } from "./definitions";
import { Message } from "discord.js";
import { getPrefix } from "../data/getPrefix";
import { CommandRequirement } from "./requirements";

var commands: Map<string, Command>;

function prepareSubcommands(list: CommandDefinition[], inheritedOptions?: {
    path: string;
    requirements: CommandRequirement[];
}): Map<string, Command> {
    const map = new Map<string, Command>();

    for (let definition of list.values()) {
        let options: {
            path: string;
            requirements: CommandRequirement[];
        } = {
            requirements: inheritedOptions?.requirements.slice() ?? [],
            path: inheritedOptions?.path
                ? `${inheritedOptions.path}/${definition.name}`
                : definition.name
        };

        if (definition.requirements) {
            const requirements = Array.isArray(definition.requirements)
                ? definition.requirements
                : [definition.requirements];
            
            options.requirements.push(...requirements);
        }
        
        map.set(definition.name, {
            name: definition.name,
            path: options.path,
            args: definition.args ?? [0, 0, ""],
            func: definition.func ?? null,
            alwaysReactOnSuccess: definition.alwaysReactOnSuccess ?? false,
            requirements: options.requirements,
            subcommands: definition.subcommands
                ? prepareSubcommands(definition.subcommands, options)
                : new Map<string, Command>(),
        })
    }

    return map;
}

/**
 * Loads commands into internal cache.
 */
export async function loadCommands() {
    const definitions = await importCommands(pathToFileURL(botDirectory + "/commands/foo").toString());
    commands = prepareSubcommands(definitions);
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
    let list: Map<string, Command> | undefined = commands;
    do {
        let found: Command | undefined = list.get(path[0]);
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
    return `${getPrefix(msg.guildId)}${command.path.replaceAll("/", " ")} ${command.args[2]}`
}
