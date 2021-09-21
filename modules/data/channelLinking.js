import { TextChannel } from "discord.js";
import { data } from "../../env.js";

/**
 * @typedef {import("discord.js").Snowflake} Snowflake
 * @private
 */

/** @enum {"SOURCE" | "DESTINATION"} */
export const ChannelLinkRole = {
    SOURCE: "SOURCE",
    DESTINATION: "DESTINATION"
};

/**
 * @typedef ChannelLink
 * @property {Snowflake} channelId
 * @property {Snowflake} guildId
 * @property {ChannelLinkRole} role
 * @property {Snowflake?} lastMessageId
 */

/**
 * 
 * @param {TextChannel} src
 * @param {TextChannel} dest
 */
export async function linkChannel(src, dest) {
    /** @type {ChannelLink} */
    let srcToDestLink = {
        channelId: dest.id,
        guildId: dest.guildId,
        role: "SOURCE",
        lastMessageId: (await src.messages.fetch({ limit: 1 })).firstKey() ?? null
    };

    /** @type {ChannelLink} */
    let destFromSrcLink = {
        channelId: src.id,
        guildId: src.guildId,
        role: "DESTINATION"
    };

    data.guilds[src.guildId].channels[src.id].link = srcToDestLink;
    data.guilds[dest.guildId].channels[dest.id].link = destFromSrcLink;
}

/**
 * @param {import("discord.js").TextChannel | {
 *  id: Snowflake;
 *  guildId: Snowflake;
 * }} channel
 */
export function unlinkChannel(channel) {
    /** @type {ChannelLink} */
    let link = data.guilds[channel.guildId].channels[channel.id].link;
    if (!link) return;

    data.guilds[channel.guildId].channels[channel.id].link = null;
    data.guilds[link.guildId].channels[link.channelId].link = null;
}

/**
 * @param {Snowflake} guildId
 * @param {ChannelLinkRole?} role
 * @returns {[Snowflake, ChannelLink][]}
 */
export function getLinks(guildId, role) {
    return Object.entries(data.guilds[guildId].channels)
        .filter(([, channelData]) => channelData.link)
        .map(([id, channelData]) => ([id, channelData.link]))
        .filter(([, link]) => !role || link.role === role);
}

/**
 * 
 * @param {Snowflake} guildId
 * @param {Snowflake} channelId
 * @returns {ChannelLink}
 */
export function getLinkedChannel(guildId, channelId) {
    return data.guilds[guildId].channels[channelId].link;
}

/**
 * @param {import("discord.js").Snowflake} guildId
 * @param {import("discord.js").Snowflake} channelId
 * @returns {boolean}
 */
export function isChannelLinked(guildId, channelId) {
    return Boolean(getLinkedChannel(guildId, channelId));
}

