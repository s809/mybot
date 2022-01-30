import { Message, Permissions } from "discord.js";
import { client, isDebug } from "../../env.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

/**
 * @param {Message} msg
 * @param {string} guildId
 * @param {string} emojiName
 * @param {string} newEmojiName
 */
async function importEmoji(msg, guildId, emojiName, newEmojiName = emojiName) {
    let language = getLanguageByMessage(msg);

    if (!msg.guild.me.permissions.has(Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS))
        return getTranslation(language, "errors", "cannot_manage_emojis");

    let guild = client.guilds.resolve(guildId);
    if (!guild)
        return getTranslation(language, "errors", "unknown_server");

    let emoji = guild.emojis.cache.find(x => x.name === emojiName);
    if (!emoji)
        return getTranslation(language, "errors", "unknown_emoji");

    if (msg.guild.emojis.cache.some(x => x.name === newEmojiName))
        return getTranslation(language, "errors", "emoji_already_exists");

    try {
        await msg.guild.emojis.create(emoji.url, newEmojiName);
    }
    catch (e) {
        if (isDebug)
            throw e;

        return getTranslation(language, "errors", "emoji_create_failed");
    }
}

export const name = "import";
export const args = "<server id> <emoji name> [new emoji name]";
export const minArgs = 2;
export const maxArgs = 3;
export const managementPermissionLevel = Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS;
export const func = importEmoji;
