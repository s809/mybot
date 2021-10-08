"use strict";

import { Message } from "discord.js";
import { client, data, owner } from "../../env.js";
import { resolveCommand } from "../../modules/commands/commands.js";
import { importCommands } from "../../modules/commands/importHelper.js";
import { isCommandAllowedToManage } from "../../modules/commands/permissions.js";

/**
 * @param {Message} msg
 * @param {string} id
 * @param {string} commandPath
 */
async function permission(msg, id, commandPath) {
    let command = resolveCommand(commandPath);
    if (!command)
        return "Unknown command.";
    if (!isCommandAllowedToManage(msg, command))
        return "You don't have permission to manage this command.";

    /** @type {"user" | "role" | "member"} */
    let resolvedType;

    try {
        if (msg.guild) {
            if (await msg.guild.roles.fetch(id))
                resolvedType = "role";
            else if (await msg.guild.members.fetch(id))
                resolvedType = "member";
        } else if (await client.users.fetch(id))
            resolvedType = "user";
    }
    catch (e) {
        return "Invalid ID was provided.";
    }

    /** @type {{ allowedCommands: string[] }} */
    let resolvedItem;
    switch (resolvedType) {
        case "user":
            // Users can only be managed by bot owner.
            if (msg.author.id !== owner)
                return "You don't have permission to manage this type of target.";

            data.users[id] ??= {
                allowedCommands: []
            };
            resolvedItem = data.users[id];
            break;
        case "role":
            resolvedItem = data.guilds[msg.guildId].roles[id];
            break;
        case "member":
            resolvedItem = data.guilds[msg.guildId].members[id];
            break;
    }

    if (!resolvedItem.allowedCommands.includes(commandPath))
        resolvedItem.allowedCommands.push(commandPath);
    else
        resolvedItem.allowedCommands.splice(resolvedItem.allowedCommands.indexOf(commandPath));
}

export const name = "permission";
export const description = "manage permissions of specific item.\nRequires item to be manageable by caller";
export const args = "<id> <permission>";
export const minArgs = 2;
export const maxArgs = 2;
export const func = permission;
export const subcommands = await importCommands(import.meta.url);
