/**
 * @file Command for pausing playback.
 */
import Discord from "discord.js";
import { musicPlayingGuilds } from "../../env.js";

/**
 * Pauses playback.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 */
async function pause(msg) {
    if (!musicPlayingGuilds.has(msg.guild))
        return "Nothing is not playing here.";

    let entry = musicPlayingGuilds.get(msg.guild);
    entry.player.pause();
}

export const name = "pause";
export const description = "pause player";
export const func = pause;
