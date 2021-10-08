import { data, defaultPrefix } from "../../env.js";

/**
 * Retrieves prefix for specified guild.
 * 
 * @param {import("discord.js").Snowflake?} guildId ID of a guild.
 * @returns {string} Retrieved prefix, or default if guild was not specified.
 */
export function getPrefix(guildId) {
    return data.guilds[guildId]?.prefix ?? defaultPrefix;
}
