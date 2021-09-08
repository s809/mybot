"use strict";

import { data } from "../../env.js";

/**
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
