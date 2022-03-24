import { Message } from "discord.js";
import { Translator } from "../../modules/misc/Translator.js";

/**
 * @param {Message} msg
 * @param {string} emojiName
 */
async function showEmoji(msg, emojiName) {
    let translator = Translator.get(msg);

    let emoji = msg.guild.emojis.cache.find(x => x.name === emojiName);
    if (!emoji)
        return translator.translate("errors.unknown_emoji");

    await msg.channel.send({
        embeds: [{
            title: translator.translate(emoji.animated ? "embeds.emoji_show.title_for_normal" : "embeds.emoji_show.title_for_animated", emoji.name),
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
