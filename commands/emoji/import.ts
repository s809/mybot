import { Message, Permissions } from "discord.js";
import { client, isDebug } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function importEmoji(msg: Message, guildId: string, emojiName: string, newEmojiName: string = emojiName) {
    let translator = Translator.get(msg);

    if (!msg.guild.members.me.permissions.has("ManageEmojisAndStickers"))
        return translator.translate("errors.cannot_manage_emojis");

    let guild = client.guilds.resolve(guildId);
    if (!guild)
        return translator.translate("errors.unknown_server");

    let emoji = guild.emojis.cache.find(x => x.name === emojiName);
    if (!emoji)
        return translator.translate("errors.unknown_emoji");

    if (msg.guild.emojis.cache.some(x => x.name === newEmojiName))
        return translator.translate("errors.emoji_already_exists");

    try {
        await msg.guild.emojis.create(emoji.url, newEmojiName);
    }
    catch (e) {
        if (isDebug)
            throw e;

        return translator.translate("errors.emoji_create_failed");
    }
}

const command: Command = {
    name: "import",
    args: [2, 3, "<server id> <emoji name> [new emoji name]"],
    managementPermissionLevel: "ManageEmojisAndStickers",
    func: importEmoji
};
export default command;
