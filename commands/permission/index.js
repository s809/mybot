"use strict";

import { Message } from "discord.js";
import { client, data, owner } from "../../env.js";
import { resolveCommand, makeSubCommands } from "../../modules/commands/commands.js";
import { isCommandAllowedToManage } from "../../modules/commands/permissions.js";

import * as list from "./list.js";

/**
 * @param {Message} msg
 * @param {string} id
 * @param {string} commandPath
 */
async function permission(msg, id, commandPath) {
    if (!isCommandAllowedToManage(msg, resolveCommand(commandPath))) {
        await msg.channel.send("You don't have permission to manage this command.");
        return false;
    }

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
        await msg.channel.send("Invalid ID was provided.");
        return false;
    }

    /** @type {{ allowedCommands: string[] }} */
    let resolvedItem;
    switch (resolvedType) {
        case "user":
            // Users can only be managed by bot owner.
            if (msg.author.id !== owner) {
                await msg.channel.send("You don't have permission to manage this type of target.");
                return false;
            }

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
    return true;
}

export const name = "permission";
export const description = "manage permissions of specific item.\nRequires item to be manageable by caller";
export const args = "<id> <permission>";
export const minArgs = 2;
export const maxArgs = 2;
export const func = permission;
export const subcommands = makeSubCommands(list);
