import { Message } from "discord.js";
import { isChannelLinked } from "../../modules/data/channelLinking.js";

/**
 * @param {Message} msg
 */
async function resetChannel(msg) {
    if (isChannelLinked(msg.guild.id, msg.channel.id))
        return "Disable channel linking first.";

    await Promise.all([
        (async () => {
            let channel = await msg.channel.clone();
            await channel.setPosition(msg.channel.position);
        })(),
        msg.channel.delete()
    ]);
}

export const name = "reset";
export const description = "clone and delete this channel";
export const minArgs = 0;
export const maxArgs = 0;
export const func = resetChannel;
