import { data } from "../env.js";
import { Translator } from "../modules/misc/Translator.js";

/**
 * @param {import("discord.js").Message} msg
 * @param {string} newLang
 * @returns
 */
function lang(msg, newLang) {
    let translator = Translator.get(msg);

    if (msg.guild && !msg.member.permissions.has("MANAGE_GUILD"))
        return translator.translate("errors.cannot_manage_language");

    if (!Translator.get(newLang))
        return translator.translate("errors.invalid_language");

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
