"use strict";

import assert from "assert";
import { Message } from "discord.js";
import { client, data } from "../../env.js";

/**
 * @param {Message} msg
 * @param {string} id
 */
async function permissionList(msg, id = msg.author.id) {
    /** @type {"user" | "role" | "member"} */
    let resolvedType;
    let resolvedItem;

    try {
        if (msg.guild) {
            resolvedItem = await msg.guild.roles.fetch(id);
            if (resolvedItem) {
                resolvedType = "role";
            }
            else {
                resolvedItem = await msg.guild.members.fetch(id);
                if (resolvedItem)
                    resolvedType = "member";
            }
        } else {
            resolvedItem = await client.users.fetch(id);
            if (resolvedItem)
                resolvedType = "user";
        }

        assert(resolvedType);
    }
    catch (e) {
        return "Invalid ID was provided.";
    }

    /** @type {string[]} */
    let userCommands;
    /** @type {string[]} */
    let roleCommands;
    /** @type {string[]} */
    let memberCommands;
    switch (resolvedType) {
        case "user":
            userCommands = data.users[id]?.allowedCommands ?? [];
            break;
        case "role":
            roleCommands = data.guilds[msg.guildId].roles[id].allowedCommands;
            break;
        case "member":
            userCommands = data.users[id].allowedCommands;
            roleCommands = (await msg.guild.members.fetch(id)).roles.cache
                .map(role => data.guilds[msg.guildId].roles[role.id].allowedCommands
                    .map(x => `${role.toString()} - ${x}`)
            ).flat();
            memberCommands = data.guilds[msg.guildId].members[id].allowedCommands;
            break;
    }

    let fields = [];

    if (userCommands) {
        fields.push({
            name: "User",
            value: userCommands.length
                ? userCommands.join("\n")
                : "None"
        });
    }
    if (roleCommands) {
        fields.push({
            name: "Role",
            value: roleCommands.length
                ? roleCommands.join("\n")
                : "None"
        });
    }
    if (memberCommands) {
        fields.push({
            name: "Member",
            value: memberCommands.length
                ? memberCommands.join("\n")
                : "None"
        });
    }

    await msg.channel.send({
        embeds: [{
            title: `Permission list for ${resolvedItem.name ??
                resolvedItem.user?.tag ??
                resolvedItem.tag
                }`,
            fields: fields
        }]
    });
}

export const name = "list";
export const description = "get permissions of specific item";
export const args = "<id>";
export const maxArgs = 1;
export const func = permissionList;
