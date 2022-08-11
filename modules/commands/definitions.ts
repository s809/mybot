/**
 * @file Contains definitions for commands.
 */

import { Awaitable, Message } from "discord.js";
import { CommandRequirement } from "./requirements";

export interface CommandDefinition {
    name: string;
    args?: [number, number, string];
    func?: CommandHandler;
    alwaysReactOnSuccess?: boolean;
    subcommands?: CommandDefinition[];
    requirements?: CommandRequirement | CommandRequirement[];
}

export interface Command {
    name: string;
    path: string;
    args: [number, number, string];
    func: CommandHandler | null;
    alwaysReactOnSuccess: boolean;
    subcommands: Map<string, Command>;
    requirements: CommandRequirement[];
}

/** Handler function of a command. */
export interface CommandHandler {
    (
        /** Message the command was sent from. */
        msg: Message,
        /** Command arguments. */
        ...args: string[]
    ): Awaitable<string | void>;
}
