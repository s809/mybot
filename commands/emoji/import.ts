import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { client, debug } from "../../env";
import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition } from "../../modules/commands/definitions";
import { ServerPermissions } from "../../modules/commands/requirements";
import { Translator } from "../../modules/misc/Translator";

async function importEmoji(msg: CommandMessage<true>, guildId: string, emojiName: string, newEmojiName: string = emojiName) {
    let translator = Translator.getOrDefault(msg);

    if (!msg.guild.members.me!.permissions.has("ManageEmojisAndStickers"))
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
        await msg.guild.emojis.create({
            name: newEmojiName,
            attachment: emoji.url
        });
    }
    catch (e) {
        if (debug)
            throw e;

        return translator.translate("errors.emoji_create_failed");
    }
}

const command: CommandDefinition = {
    key: "import",
    args: [{
        translationKey: "serverId",
        type: ApplicationCommandOptionType.String,
    }, {
        translationKey: "emojiName",
        type: ApplicationCommandOptionType.String,
    }, {
        translationKey: "newName",
        type: ApplicationCommandOptionType.String,
        required: false,
    }],
    handler: importEmoji,
    alwaysReactOnSuccess: true,
    requirements: ServerPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
};
export default command;
