import { Snowflake } from "discord.js";
import { Guild } from "../../database/models";
import { defaults } from "../../constants";

/**
 * Retrieves prefix for specified guild.
 * 
 * @param guildId ID of a guild.
 * @returns Retrieved prefix, or default if guild was not specified.
 */
export async function getPrefix(guildId: Snowflake | null) {
    return guildId
        ? (await Guild.findByIdOrDefault(guildId, { prefix: 1 })).prefix
        : defaults.prefix;
}
