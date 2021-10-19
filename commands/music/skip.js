/**
 * @file Command for skipping current song.
 */
import Discord from "discord.js";
import { musicPlayingGuilds } from "../../env.js";

/**
 * Skips current song.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 */
async function skip(msg) {
    let entry = musicPlayingGuilds.get(msg.guild);
    if (!entry)
        return "Nothing is not playing here.";

    // Destroying current entry *always* leads to moving player to next song.
    entry.readable.destroy();
    entry.player.unpause();
}

export const name = "skip";
export const description = "skip currently playing song";
export const func = skip;
