import { data } from "../env.js";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";
import { Translator } from "../modules/misc/Translator.js";

/**
 * @param {import("discord.js").Message} msg
 * @param {string} newPrefix
 */
function prefix(msg, newPrefix) {
    let translator = Translator.get(msg);

    if (!msg.guild)
        return translator.translate("errors.not_in_server");

    if (newPrefix.match(/[\\"\s]/))
        return translator.translate("errors.invalid_prefix");

    data.guilds[msg.guildId].prefix = newPrefix;
}

export const name = "prefix";
export const args = "<newPrefix>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = prefix;
export const managementPermissionLevel = CommandManagementPermissionLevel.SERVER_OWNER;
