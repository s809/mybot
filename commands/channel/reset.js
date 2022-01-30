import { Message } from "discord.js";
import { isChannelLinked } from "../../modules/data/channelLinking.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

/**
 * @param {Message} msg
 */
async function resetChannel(msg) {
    if (isChannelLinked(msg.guild.id, msg.channel.id))
        return getTranslation(getLanguageByMessage(msg), "errors", "channel_needs_unlink");

    await Promise.all([
        (async () => {
            let channel = await msg.channel.clone();
            await channel.setPosition(msg.channel.position);
        })(),
        msg.channel.delete()
    ]);
}

export const name = "reset";
export const minArgs = 0;
export const maxArgs = 0;
export const func = resetChannel;
