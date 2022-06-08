import { GuildTextBasedChannel, Snowflake, TextChannel } from "discord.js";
import { data } from "../../env";
import { ChannelLink, ChannelLinkRole } from "./models";

export async function linkChannel(src: GuildTextBasedChannel, dest: GuildTextBasedChannel) {
    let srcToDestLink = <ChannelLink>{
        channelId: dest.id,
        guildId: dest.guildId,
        role: "Source",
        lastMessageId: (await src.messages.fetch({ limit: 1 })).firstKey() ?? null
    };

    let destFromSrcLink = <ChannelLink>{
        channelId: src.id,
        guildId: src.guildId,
        role: "Destination"
    };

    data.guilds[src.guildId].channels[src.id].link = srcToDestLink;
    data.guilds[dest.guildId].channels[dest.id].link = destFromSrcLink;
}

export function unlinkChannel(channel: TextChannel | {
    id: Snowflake;
    guildId: Snowflake;
}) {
    let link = data.guilds[channel.guildId].channels[channel.id].link;
    if (!link) return;

    data.guilds[channel.guildId].channels[channel.id].link = null;
    data.guilds[link.guildId].channels[link.channelId].link = null;
}

export function getLinks(guildId: Snowflake, role?: ChannelLinkRole): [Snowflake, ChannelLink][] {
    return Object.entries(data.guilds[guildId].channels)
        .filter(([, channelData]) => channelData.link)
        .map(([id, channelData]) => ([id, channelData.link] as [Snowflake, ChannelLink]))
        .filter(([, link]) => !role || link.role === role);
}

export function getLinkedChannel(guildId: Snowflake, channelId: Snowflake): ChannelLink {
    return data.guilds[guildId].channels[channelId].link;
}

export function isChannelLinked(guildId: Snowflake, channelId: Snowflake): boolean {
    return Boolean(getLinkedChannel(guildId, channelId));
}

