"use strict";

import { Message } from "discord.js";
import { data, owner } from "../env.js";
import { CommandManagementPermissionLevel } from "../util.js";

/**
 * Checks if user has required permissions to manage command in their context.
 *
 * @param {Message} msg Context message.
 * @param {import("../util").Command} command Command to check.
 * @returns {boolean} Whether the execution of command is allowed.
 */
export function isCommandAllowedToManage(msg, command) {
    if (!command.managementPermissionLevel)
        return false;

    const isBotOwner = () => msg.author.id === owner;
    const isServerOwner = () => isBotOwner() || (msg.guild && msg.guild.ownerId === msg.author.id);
    const hasSpecifiedPermissions = () => isServerOwner() || (msg.member && msg.member.permissions.has(command.managementPermissionLevel));

    switch (command.managementPermissionLevel) {
        case CommandManagementPermissionLevel.BOT_OWNER:
            if (isBotOwner())
                return true;
            break;
        case CommandManagementPermissionLevel.SERVER_OWNER:
            if (isServerOwner())
                return true;
            break;
        default:
            if (hasSpecifiedPermissions())
                return true;
            break;
    }

    return false;
}

/**
 * Checks if user has required permissions to execute command in their context.
 *
 * @param {Message} msg Context message.
 * @param {import("../util").Command} command Command to check.
 * @returns {boolean} Whether the management of command is allowed.
 */
export function isCommandAllowedToUse(msg, command) {
    if (!command.managementPermissionLevel)
        return true;

    if (isCommandAllowedToManage(msg, command))
        return true;
    
    /** @type {string[]} */
    let allowedCommands = [
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
