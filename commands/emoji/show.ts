import { APIEmoji, Collection, GuildEmoji, Message, parseEmoji } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function showEmoji(msg: Message, emojiOrName: string) {
    let translator = Translator.getOrDefault(msg);

    let emoji: APIEmoji | GuildEmoji | null = parseEmoji(emojiOrName);
    if (!emoji?.id)
        emoji = (await msg.guild?.emojis.fetch())?.find(x => x.name === emojiOrName) ?? null;
    if (!emoji)
        return translator.translate("errors.unknown_emoji");

    await msg.channel.send({
        embeds: [{
            title: translator.translate(!emoji.animated ? "embeds.emoji_show.title_for_normal" : "embeds.emoji_show.title_for_animated", emoji.name!),
            image: {
                url: emoji instanceof GuildEmoji
                    ? emoji.url
                    : `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`
            }
        }]
    });
}

const command: Command = {
    name: "show",
    args: [1, 1, "<emoji or emoji name>"],
    func: showEmoji
};
export default command;
