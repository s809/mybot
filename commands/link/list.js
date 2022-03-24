import { client } from "../../env.js";
import { ChannelLinkRole, getLinks } from "../../modules/data/channelLinking.js";
import { Translator } from "../../modules/misc/Translator.js";

/**
 * 
 * @param {import("discord.js").Message} msg 
 */
async function getLinkedChannels(msg) {
    /** @type {Set<import("discord.js").Snowflake} */
    let ids = new Set();

    let response = "";
    for (let [id, link] of getLinks(msg.guildId)) {
        let fromChannel = client.channels.resolve(id);
        let toChannel = client.channels.resolve(link.channelId);

        if (link.role === ChannelLinkRole.DESTINATION)
            [fromChannel, toChannel] = [toChannel, fromChannel];

        if (ids.has(fromChannel.id)) continue;
        ids.add(fromChannel.id);

        response += `${fromChannel} (${fromChannel.guild}) => ${toChannel} (${toChannel.guild})\n`;
    }

    let translator = Translator.get(msg);
    await msg.channel.send({
        embeds: [{
            title: translator.translate("embeds.link_list.title"),
            description: response || translator.translate("embeds.link_list.no_channels_linked")
        }]
    });
}

export const name = "list";
export const minArgs = 0;
export const maxArgs = 0;
export const func = getLinkedChannels;
