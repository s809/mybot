import { Snowflake } from "discord.js";
import { data, defaultPrefix } from "../../env";

/**
 * Retrieves prefix for specified guild.
 * 
 * @param guildId ID of a guild.
 * @returns Retrieved prefix, or default if guild was not specified.
 */
export function getPrefix(guildId: Snowflake | null): string {
    return guildId
        ? data.guilds[guildId]?.prefix
        : defaultPrefix;
}
