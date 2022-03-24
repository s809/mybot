import { Message } from "discord.js";
import { isChannelLinked } from "../../modules/data/channelLinking.js";
import { Translator } from "../../modules/misc/Translator.js";

/**
 * @param {Message} msg
 */
async function resetChannel(msg) {
    if (isChannelLinked(msg.guild.id, msg.channel.id))
        return Translator.get(msg).translate("errors.channel_needs_unlink");

    await Promise.all([
        msg.channel.clone()
            .then(channel => channel.setPosition(msg.channel.position)),
        msg.channel.delete()
    ]);
}

export const name = "reset";
export const minArgs = 0;
export const maxArgs = 0;
export const func = resetChannel;
