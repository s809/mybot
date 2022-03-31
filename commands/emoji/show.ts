import { Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function showEmoji(msg: Message, emojiName: string) {
    let translator = Translator.get(msg);

    let emoji = msg.guild.emojis.cache.find(x => x.name === emojiName);
    if (!emoji)
        return translator.translate("errors.unknown_emoji");

    await msg.channel.send({
        embeds: [{
            title: translator.translate(!emoji.animated ? "embeds.emoji_show.title_for_normal" : "embeds.emoji_show.title_for_animated", emoji.name),
            image: {
                url: emoji.url
            }
        }]
    });
}

const command: Command = {
    name: "show",
    args: [1, 1, "<emoji name>"],
    func: showEmoji
};
export default command;
