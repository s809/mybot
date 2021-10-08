import { data } from "../env.js";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";

/**
 * @param {import("discord.js").Message} msg
 * @param {string} newPrefix
 */
function prefix(msg, newPrefix) {
    if (!msg.guild)
        return "This command is only available in servers.";

    if (newPrefix.match(/[\\"\s]/))
        return "Invalid prefix.";
    
    data.guilds[msg.guildId].prefix = newPrefix;
}

export const name = "prefix";
export const description = "change prefix";
export const args = "<newPrefix>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = prefix;
export const managementPermissionLevel = CommandManagementPermissionLevel.SERVER_OWNER;
