import { GuildTextBasedChannel, Snowflake, TextChannel } from "discord.js";
import { data } from "../../env";

export type ChannelLinkRole =
    "SOURCE"
    | "DESTINATION";

export interface ChannelLink {
    channelId: Snowflake;
    guildId: Snowflake;
    role: ChannelLinkRole;
    lastMessageId?: Snowflake;
}

export async function linkChannel(src: GuildTextBasedChannel, dest: GuildTextBasedChannel) {
    let srcToDestLink: ChannelLink = {
        channelId: dest.id,
        guildId: dest.guildId,
        role: "SOURCE",
        lastMessageId: (await src.messages.fetch({ limit: 1 })).firstKey() ?? null
    };

    let destFromSrcLink: ChannelLink = {
        channelId: src.id,
        guildId: src.guildId,
        role: "DESTINATION"
    };

    data.guilds[src.guildId].channels[src.id].link = srcToDestLink;
    data.guilds[dest.guildId].channels[dest.id].link = destFromSrcLink;
}

export function unlinkChannel(channel: import("discord.js").TextChannel | {
        id: Snowflake;
        guildId: Snowflake;
    }) {
    let link: ChannelLink = data.guilds[channel.guildId].channels[channel.id].link;
    if (!link) return;

    data.guilds[channel.guildId].channels[channel.id].link = null;
    data.guilds[link.guildId].channels[link.channelId].link = null;
}

export function getLinks(guildId: Snowflake, role?: ChannelLinkRole): [Snowflake, ChannelLink][] {
    return Object.entries(data.guilds[guildId].channels as {
        [id: string]: {
            link?: ChannelLink
        }
    })
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

