"use strict";

import { GuildChannel } from "discord.js";
import { data } from "../../env.js";

/** @typedef {import("discord.js").Snowflake} Snowflake */

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
 * @param {GuildChannel} src
 * @param {GuildChannel} dest
 */
export function linkChannel(src, dest) {
    /** @type {ChannelLink} */
    let srcToDestLink = {
        channelId: dest.id,
        guild: dest.guildId,
        role: "SOURCE",
        lastMessageId: null
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
 * 
 * @param {GuildChannel | {
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
 * @deprecated
 * @typedef MappedChannel
 * @property {import("discord.js").Snowflake} id
 * @property {import("discord.js").Snowflake} lastMessageId
 */

/**
 * @param {import("discord.js").Snowflake} guildId
 * @returns {import("discord.js").Snowflake[]}
 */
function getKeys(guildId) {
    return Object.keys(data.guilds[guildId].mappedChannels);
}

/**
 * @param {import("discord.js").Snowflake} guildId
 * @returns {MappedChannel[]}
 */
function getValues(guildId) {
    let keys = getKeys(guildId);
    let mappedChannels = data.guilds[guildId].mappedChannels;
    return keys.map(key => mappedChannels[key].id);
}

/**
 * @param {import("discord.js").Snowflake} guildId
 * @returns {[import("discord.js").Snowflake, MappedChannel][]}
 */
export function getMappedChannelEntries(guildId) {
    let keys = getKeys(guildId);
    let mappedChannels = data.guilds[guildId].mappedChannels;
    return keys.map(key => [key, mappedChannels[key]]);
}

/**
 * @param {import("discord.js").Snowflake} guildId
 * @param {import("discord.js").Snowflake} channelId
 * @returns {boolean}
 */
export function isChannelMapped(guildId, channelId) {
    return channelId in data.guilds[guildId].mappedChannels ||
        getValues(guildId).includes(channelId);
}

/**
 * @param {import("discord.js").Snowflake} guildId
 * @param {import("discord.js").Snowflake} channelId
 * @returns {MappedChannel}
 */
export function getMappedChannel(guildId, channelId) {
    return data.guilds[guildId].mappedChannels[channelId];
}

/**
 * @param {import("discord.js").Snowflake} guildId
 * @param {import("discord.js").Snowflake} channelId
 * @returns {[import("discord.js").Snowflake, MappedChannel]?}
 */
export function getMappedChannelByDest(guildId, channelId) {
    return getMappedChannelEntries(guildId).find(x => x[1].id === channelId);
}
