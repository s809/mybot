import { data } from "../env.js";
import { getLanguageByMessage, getTranslation, languageExists } from "../modules/misc/translations.js";

/**
 * @param {import("discord.js").Message} msg
 * @param {string} newLang
 */
function lang(msg, newLang) {
    let language = getLanguageByMessage(msg);

    if (msg.guild && !msg.member.permissions.has("MANAGE_GUILD"))
        return getTranslation(language, "errors", "cannot_manage_language");

    if (!languageExists(newLang))
        return getTranslation(language, "errors", "invalid_language");

    if (msg.guild)
        data.guilds[msg.guildId].language = newLang;
    else
        data.users[msg.author.id].language = newLang;
}

export const name = "lang";
export const args = "<newLang>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = lang;
