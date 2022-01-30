/**
 * @file Command for skipping current song.
 */
import Discord from "discord.js";
import { musicPlayingGuilds } from "../../env.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

/**
 * Skips current song.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 */
async function skip(msg) {
    let entry = musicPlayingGuilds.get(msg.guild);
    if (!entry)
        return getTranslation(getLanguageByMessage(msg), "errors", "nothing_is_playing");

    // Destroying current entry *always* leads to moving player to next song.
    entry.readable.destroy();
    entry.player.unpause();
}

export const name = "skip";
export const func = skip;
