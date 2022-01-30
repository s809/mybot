import { Message } from "discord.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

/**
 * @param {Message} msg
 * @param {string} emojiName
 */
async function showEmoji(msg, emojiName) {
    let language = getLanguageByMessage(msg);
    let emoji = msg.guild.emojis.cache.find(x => x.name === emojiName);
    if (!emoji)
        return getTranslation(language, "errors", "unknown_emoji");

    await msg.channel.send({
        embeds: [{
            title: getTranslation(language, "common", emoji.animated ? "emoji" : "emoji_animated", emoji.name),
            image: {
                url: emoji.url
            }
        }]
    });
}

export const name = "show";
export const args = "<emoji name>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = showEmoji;
