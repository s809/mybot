import { client } from "../../env.js";
import { ChannelLinkRole, getLinks } from "../../modules/data/channelLinking.js";

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

    if (response !== "")
        await msg.channel.send(response);

    return true;
}

export const name = "list";
export const description = "get channel links for this server";
export const minArgs = 0;
export const maxArgs = 0;
export const func = getLinkedChannels;
