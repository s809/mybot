import { APIEmoji, ApplicationCommandOptionType, GuildEmoji, parseEmoji } from "discord.js";
import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function showEmoji(msg: CommandMessage, emojiOrName: string) {
    let translator = Translator.getOrDefault(msg);

    let emoji: APIEmoji | GuildEmoji | null = parseEmoji(emojiOrName);
    if (!emoji?.id)
        emoji = (await msg.guild?.emojis.fetch())?.find(x => x.name === emojiOrName) ?? null;
    if (!emoji)
        return translator.translate("errors.unknown_emoji");

    await msg.reply({
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

const command: CommandDefinition = {
    key: "show",
    args: [{
        translationKey: "emojiOrName",
        type: ApplicationCommandOptionType.String,
    }],
    handler: showEmoji
};
export default command;
