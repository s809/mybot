import { Message, PermissionResolvable } from "discord.js";
import { data, isBotOwner } from "../../env";
import { Command } from "./definitions";

/**
 * @typedef {import("./definitions").Command} Command
 * @private
 */

/**
 * Checks if user has required permissions to manage command in their context.
 *
 * @param msg Context message.
 * @param command Command to check.
 * @returns Whether the execution of command is allowed.
 */
export function isCommandAllowedToManage(msg: Message, command: Command): boolean {
    if (!command.managementPermissionLevel)
        return false;

    const isServerOwner = () => isBotOwner(msg.author) || (msg.guild && msg.guild.ownerId === msg.author.id);
    const hasSpecifiedPermissions = () => isServerOwner() || (msg.member && msg.member.permissions.has(command.managementPermissionLevel as PermissionResolvable));

    switch (command.managementPermissionLevel) {
        case "BotOwner":
            return isBotOwner(msg.author);
        case "ServerOwner":
            return isServerOwner();
        default:
            return hasSpecifiedPermissions();
    }
}

/**
 * Checks if user has required permissions to execute command in their context.
 *
 * @param msg Context message.
 * @param command Command to check.
 * @returns Whether the management of command is allowed.
 */
export function isCommandAllowedToUse(msg: Message, command: Command): boolean {
    if (!command.managementPermissionLevel)
        return true;

    if (isCommandAllowedToManage(msg, command))
        return true;

    /** @type {string[]} */
    let allowedCommands: string[] = [
        // Global user
        ...data.users[msg.author.id].allowedCommands
    ];

    if (msg.member) {
        allowedCommands.push(
            // Server role
            ...[...msg.member.roles.cache.values()]
                .flatMap(role => data.guilds[msg.guildId].roles[role.id].allowedCommands),
            // Server member
            ...data.guilds[msg.guildId].members[msg.author.id].allowedCommands
        );
    }

    for (let allowedCommand of allowedCommands) {
        if (command.path.startsWith(allowedCommand))
            return true;
    }

    return false;
}
