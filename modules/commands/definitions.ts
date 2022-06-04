/**
 * @file Contains definitions for commands.
 */

import { Awaitable, Message, PermissionResolvable } from "discord.js";

export interface Command {
    name: string;
    path?: string;
    args?: [number, number, string];
    func?: CommandHandler;
    subcommands?: Map<string, Command>;
    managementPermissionLevel?: CommandManagementPermissionLevel;
}

/** Elevation level for managing specific command. */
export type CommandManagementPermissionLevel =
    PermissionResolvable
    | "BotOwner"
    | "ServerOwner";

/** Handler function of a command. */
export interface CommandHandler {
    (
        /** Message the command was sent from. */
        msg: Message,
        /** Command arguments. */
        ...args: string[]
    ): Awaitable<string | void>;
}
