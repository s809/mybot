import assert from "assert";
import { Message } from "discord.js";
import { client, data } from "../../env.js";
import { Translator } from "../../modules/misc/Translator.js";

/**
 * @param {Message} msg
 * @param {string} id
 */
async function permissionList(msg, id = msg.author.id) {
    let translator = Translator.get(msg);

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
        return translator.translate("errors.invalid_id");
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
    if (userCommands?.length) {
        fields.push({
            name: translator.translate("embeds.permission_list.user"),
            value: userCommands.join("\n")
        });
    }
    if (roleCommands?.length) {
        fields.push({
            name: translator.translate("embeds.permission_list.role"),
            value: roleCommands.join("\n")
        });
    }
    if (memberCommands?.length) {
        fields.push({
            name: translator.translate("embeds.permission_list.member"),
            value: memberCommands.join("\n")
        });
    }

    await msg.channel.send({
        embeds: [{
            title: translator.translate("embeds.permission_list.title", resolvedItem.name ??
                resolvedItem.user?.tag ??
                resolvedItem.tag),
            ...fields.length
                ? {
                    fields: fields,
                }
                : {
                    description: translator.translate("embeds.permission_list.no_permissions")
                }
        }]
    });
}

export const name = "list";
export const args = "<id>";
export const maxArgs = 1;
export const func = permissionList;
