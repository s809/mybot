import { data } from "../env.js";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";
import { getLanguageByMessage, getTranslation } from "../modules/misc/translations.js";

/**
 * @param {import("discord.js").Message} msg
 * @param {string} newPrefix
 */
function prefix(msg, newPrefix) {
    let language = getLanguageByMessage(msg);

    if (!msg.guild)
        return getTranslation(language, "errors", "not_in_server");

    if (newPrefix.match(/[\\"\s]/))
        return getTranslation(language, "errors", "invalid_prefix");
    
    data.guilds[msg.guildId].prefix = newPrefix;
}

export const name = "prefix";
export const args = "<newPrefix>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = prefix;
export const managementPermissionLevel = CommandManagementPermissionLevel.SERVER_OWNER;
