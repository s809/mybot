/**
 * @file Command for stopping playback.
 */
import Discord from "discord.js";
import { musicPlayingGuilds } from "../../env.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

/**
 * Stops playback.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 */
async function stop(msg) {
    if (!musicPlayingGuilds.has(msg.guild))
        return getTranslation(getLanguageByMessage(msg), "errors", "nothing_is_playing");

    let entry = musicPlayingGuilds.get(msg.guild);

    entry.queue = [];
    entry.readable.destroy();
    entry.player.unpause();
}

export const name = "stop";
export const func = stop;
