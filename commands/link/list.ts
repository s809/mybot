import { GuildTextBasedChannel, Message, Snowflake } from "discord.js";
import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { getLinks } from "../../modules/data/channelLinking";
import { Translator } from "../../modules/misc/Translator";

async function getLinkedChannels(msg: Message) {
    let ids: Set<Snowflake> = new Set();

    let response = "";
    for (let [id, link] of getLinks(msg.guildId)) {
        let fromChannel = client.channels.resolve(id) as GuildTextBasedChannel;
        let toChannel = client.channels.resolve(link.channelId) as GuildTextBasedChannel;

        if (link.role === "DESTINATION")
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

const command: Command = {
    name: "show",
    func: getLinkedChannels
};
export default command;
