import { Message, Permissions } from "discord.js";
import { client, isDebug } from "../../env.js";

/**
 * @param {Message} msg 
 * @param {string} guildId 
 * @param {string} emojiName 
 * @param {string} newEmojiName 
 */
async function importEmoji(msg, guildId, emojiName, newEmojiName = emojiName) {
    if (!msg.guild.me.permissions.has(Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS))
        return "Cannot manage emojis on this server.";

    let guild = client.guilds.resolve(guildId);
    if (!guild)
        return "Unknown server.";
    
    let emoji = guild.emojis.cache.find(x => x.name === emojiName);
    if (!emoji)
        return "Unknown emoji.";
    
    if (msg.guild.emojis.cache.some(x => x.name === emojiName))
        return "Emoji with this name already exists.";
    
    try {
        await msg.guild.emojis.create(emoji.url, newEmojiName);
    }
    catch (e) {
        if (isDebug)
            throw e;
        
        return "Failed to create emoji.";
    }
}

export const name = "import";
export const description = "import emoji from another server";
export const args = "<server id> <emoji name> [new emoji name]";
export const minArgs = 2;
export const maxArgs = 3;
export const func = importEmoji;
