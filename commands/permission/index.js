import { Message } from "discord.js";
import { client, data, owner } from "../../env.js";
import { resolveCommand } from "../../modules/commands/commands.js";
import { importCommands } from "../../modules/commands/importHelper.js";
import { isCommandAllowedToManage } from "../../modules/commands/permissions.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

/**
 * @param {Message} msg
 * @param {string} id
 * @param {string} commandPath
 */
async function permission(msg, id, commandPath) {
    let language = getLanguageByMessage(msg);

    let command = resolveCommand(commandPath);
    if (!command)
        return getTranslation(language, "errors", "unknown_command");
    if (!isCommandAllowedToManage(msg, command))
        return getTranslation(language, "errors", "command_management_not_allowed");

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
        return getTranslation(language, "errors", "invalid_id");
    }

    /** @type {{ allowedCommands: string[] }} */
    let resolvedItem;
    switch (resolvedType) {
        case "user":
            // Users can only be managed by bot owner.
            if (msg.author.id !== owner)
                return getTranslation(language, "errors", "target_management_not_allowed");

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
export const args = "<id> <permission>";
export const minArgs = 2;
export const maxArgs = 2;
export const func = permission;
export const subcommands = await importCommands(import.meta.url);
