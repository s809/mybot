/**
 * @file Module for importing all commands.
 */

import { pathToFileURL } from "url";
import { botDirectory } from "../../env";
import { importCommands } from "./importHelper";
import { Command, CommandDefinition } from "./definitions";
import { ApplicationCommandOptionType, LocaleString, Message, PermissionFlagsBits, PermissionResolvable } from "discord.js";
import { getPrefix } from "../data/getPrefix";
import { CommandCondition } from "./conditions";
import { CommandMessage } from "./CommandMessage";
import { Translator } from "../misc/Translator";
import { hasSameKeys } from "../../util";

var commands: Map<string, Command>;
var commandsByLocale = {} as Command["subcommandsByLocale"];

interface InheritableOptions {
    path: string;
    requirements: CommandCondition[];
    usableAsAppCommand: boolean;
    ownerOnly: boolean;
    defaultMemberPermissions: PermissionResolvable;
    allowDMs: boolean;
}

function prepareSubcommands(list: CommandDefinition[], inheritedOptions?: InheritableOptions): Map<string, Command> {
    const map = new Map<string, Command>();

    for (const definition of list.values()) {
        const options: InheritableOptions = {
            requirements: inheritedOptions?.requirements.slice() ?? [],
            path: inheritedOptions?.path
                ? `${inheritedOptions.path}/${definition.key}`
                : definition.key,
            usableAsAppCommand: inheritedOptions?.usableAsAppCommand ?? false,
            ownerOnly: inheritedOptions?.ownerOnly ?? false,
            defaultMemberPermissions: inheritedOptions?.defaultMemberPermissions ?? PermissionFlagsBits.UseApplicationCommands,
            allowDMs: inheritedOptions?.allowDMs ?? true
        };

        try {
            const translationPath = `commands.${options.path.replaceAll("/", "_")}`;
            const getLocalizations = (key: string) => Object.fromEntries([...Translator.translators.values()]
                .map(t => [t.localeString, t.tryTranslate(`${translationPath}.${key}`)] as [LocaleString, string | null])
                .filter(([, translation]) => translation !== null)) as Record<LocaleString, string>;

            // Definitions' requirements are additive.
            if (definition.conditions) {
                const requirements = Array.isArray(definition.conditions)
                    ? definition.conditions
                    : [definition.conditions];
            
                options.requirements.push(...requirements);
            }

            if (definition.defaultMemberPermissions && options.path.includes("/"))
                throw new Error("Subcommands cannot define default member permissions.");

            // If a command is marked as usable as app command, this mark
            // is inherited to all subcommands unless overridden later.
            if (definition.usableAsAppCommand !== undefined) {
                if (definition.usableAsAppCommand && options.path.includes("/"))
                    throw new Error("Only root commands can be marked as usable as app commands.");
                
                options.usableAsAppCommand = definition.usableAsAppCommand;
            }

            if (definition.ownerOnly !== undefined) {
                if (definition.ownerOnly && options.usableAsAppCommand)
                    throw new Error("Owner-only commands cannot be marked as usable as app commands.");
                if (!definition.ownerOnly && options.ownerOnly)
                    throw new Error("Owner-only category cannot contain not owner-only commands.");

                options.ownerOnly = definition.ownerOnly;
            }

            // Root command-only properties.
            for (const property of ["defaultMemberPermissions", "allowDMs"]) {
                if ((definition as any)[property] === undefined) continue;

                if (options.path.includes("/"))
                    throw new Error(`Subcommands cannot have property: ${property}`);
                
                (options as any)[property] = (definition as any)[property];
            }

            // Make sure that command is fully translated.
            const nameTranslations = getLocalizations("name")
            const descriptionTranslations = getLocalizations("description");
            if (!hasSameKeys(nameTranslations, descriptionTranslations))
                throw new Error("Command is not fully translated.");
            if (!nameTranslations[Translator.fallbackLocale])
                throw new Error("Command is not translated to the fallback locale.");

            let minArgs = 0;
            let maxArgs = 0;
            let optionalArgsStarted = false;
            let lastArgAsExtras = false;

            const argStringTranslations = {} as Record<LocaleString, string>;

            map.set(definition.key, {
                key: definition.key,

                path: options.path,
                translationPath,
                nameTranslations,
                descriptionTranslations,

                ownerOnly: options.ownerOnly,
                defaultMemberPermissions: options.defaultMemberPermissions,
                allowDMs: options.allowDMs,
                conditions: options.requirements,
                usableAsAppCommand: options.usableAsAppCommand,
                appCommandId: null, // initialized by another module

                args: {
                    list: definition.args?.map(arg => {
                        try {
                            // Make sure that argument's translation is consistent with command's translation.
                            const commandNameTranslations = nameTranslations;
                            const nameLocalizations = getLocalizations(`args.${arg.translationKey}.name`);
                            const descriptionLocalizations = getLocalizations(`args.${arg.translationKey}.description`);
                            if (!hasSameKeys(commandNameTranslations, nameLocalizations) || !hasSameKeys(commandNameTranslations, descriptionLocalizations))
                                throw new Error("Translation of the argument is not consistent with the command's translation.");

                            if (arg.required === false)
                                optionalArgsStarted = true; // If an optional argument is found, all following arguments are optional.
                            else if (optionalArgsStarted)
                                throw new Error("Optional arguments must be defined after all required arguments.");
                            else
                                minArgs++;
                            maxArgs++;

                            if (lastArgAsExtras)
                                throw new Error("Extras argument must be the last argument.");
                            if (arg.isExtras) {
                                if (arg.type !== ApplicationCommandOptionType.String)
                                    throw new Error("Extras argument type must be a string.");
                                if (arg.required === false)
                                    throw new Error("Command with extras argument cannot have optional arguments.");
                                
                                lastArgAsExtras = true;
                                maxArgs = Infinity;
                            }

                            for (const [locale, translation] of Object.entries(nameLocalizations)) {
                                const argString = arg.required !== false
                                    ? `<${translation}${arg.isExtras ? "..." : ""}>`
                                    : `[${translation}]`;
                                
                                if (!argStringTranslations[locale as LocaleString])
                                    argStringTranslations[locale as LocaleString] = argString;
                                else
                                    argStringTranslations[locale as LocaleString] += ` ${argString}`;
                            }

                            return {
                                ...arg,

                                name: nameLocalizations[Translator.fallbackLocale],
                                nameLocalizations,
                                description: descriptionLocalizations[Translator.fallbackLocale],
                                descriptionLocalizations,
                                choices: arg.choices?.map(choice => {
                                    const nameLocalizations = getLocalizations(`args.${arg.translationKey}.choices.${choice.translationKey}.name`);
                                    if (!hasSameKeys(commandNameTranslations, nameLocalizations))
                                        throw new Error(`Translation of the choice ${choice.translationKey} is not consistent with the argument's translation.`);

                                    return {
                                        name: nameLocalizations[Translator.fallbackLocale],
                                        nameLocalizations,
                                        value: choice.value
                                    };
                                }),
                                required: arg.required ?? true,
                            };
                        } catch (e) {
                            e.message += `\nArgument: ${arg.translationKey}`;
                            throw e;
                        }
                    }) as Command["args"]["list"] ?? [],
                    min: minArgs,
                    max: maxArgs,
                    stringTranslations: argStringTranslations,
                    lastArgAsExtras
                },
                handler: definition.handler ?? null,
                alwaysReactOnSuccess: definition.alwaysReactOnSuccess ?? false,

                subcommands: definition.subcommands
                    ? prepareSubcommands(definition.subcommands, options)
                    : new Map<string, Command>(),
                subcommandsByLocale: {} as Command["subcommandsByLocale"] // initialized by call to function below
            });
        } catch (e) {
            if (!e.message.includes("\nPath: "))
                e.message += `\nPath: ${options.path}`;
            throw e;
        }
    }

    return map;
}

function prepareSubcommandsByLocale(map: Map<string, Command>, toFill: Command["subcommandsByLocale"]) {
    for (const command of map.values()) {
        for (const [locale, name] of Object.entries(command.nameTranslations)) {
            (toFill as any)[locale] ??= new Map();
            (toFill as any)[locale].set(name, command);
        }

        prepareSubcommandsByLocale(command.subcommands, command.subcommandsByLocale);
    }
}

/**
 * Loads commands into internal cache.
 */
export async function loadCommands() {
    const definitions = await importCommands(pathToFileURL(botDirectory + "/commands/foo").toString());
    commands = prepareSubcommands(definitions);
    prepareSubcommandsByLocale(commands, commandsByLocale);
}

/**
 * Resolves command by its path.
 * 
 * @param path Path to command.
 * @param allowPartialResolve Whether to allow resolving to closest match.
 * @returns Command, if it was found.
 */
function resolveCommandInternal(path: string | string[],
    root: Map<string, Command>,
    getSubcommands: (command: Command) => Map<string, Command>,
    allowPartialResolve: boolean = false): Command | null {
    if (!Array.isArray(path))
        path = path.split("/");

    let command;
    let list: Map<string, Command> | undefined = root;
    do {
        let found: Command | undefined = list.get(path[0]);
        if (!found) break;

        command = found;

        list = getSubcommands(command);
        path.shift();
    } while (list);

    if (!allowPartialResolve && path.length)
        return null;

    return command ?? null;
}

export function resolveCommand(path: string | string[], allowPartialResolve: boolean = false): Command | null {
    return resolveCommandInternal(path,
        commands,
        command => command.subcommands,
        allowPartialResolve);
}

export function resolveCommandLocalized(path: string | string[], locale: LocaleString): Command | null {
    return resolveCommandInternal(path,
        commandsByLocale[locale] ?? commandsByLocale[Translator.fallbackLocale],
        command => command.subcommandsByLocale[locale] ?? command.subcommandsByLocale[Translator.fallbackLocale],
        true)
        ?? resolveCommandInternal(path,
            commandsByLocale[Translator.fallbackLocale],
            command => command.subcommandsByLocale[Translator.fallbackLocale],
            true);
}

/**
 * Returns a list with root commands.
 */
export function getRootCommands(): Command[] {
    return [...commands.values()];
}

/**
 * Recursively iterates a map with commands.
 * 
 * @param list List of commands to iterate.
 */
export function* iterateSubcommands(list: Map<string, Command>): Iterable<Command> {
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
export function toUsageString(msg: Message | CommandMessage, command: Command, translator: Translator): string {
    let localizedCommandPath = "";
    let map = commands;
    for (const a of command.path.split("/")) {
        const c = map.get(a)!;
        map = c.subcommands;
        localizedCommandPath += " " + c.nameTranslations[translator.localeString] ?? c.nameTranslations[Translator.fallbackLocale];
    }

    const localizedArgs = command.args.stringTranslations[translator.localeString]
        ?? command.args.stringTranslations[Translator.fallbackLocale]
        ?? "";
    
    return getPrefix(msg.guildId) + `${localizedCommandPath} ${localizedArgs}`.trim();
}
