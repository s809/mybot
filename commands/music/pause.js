/**
 * @file Command for pausing playback.
 */
"use strict";

import Discord from "discord.js";
import { musicPlayingGuilds } from "../../env.js";

/**
 * Pauses playback.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 */
async function pause(msg) {
    if (!musicPlayingGuilds.has(msg.guild)) {
        await msg.channel.send("Nothing is not playing here.");
        return false;
    }

    let entry = musicPlayingGuilds.get(msg.guild);
    entry.player.pause();

    return true;
}

export const name = "pause";
export const description = "pause player";
export const func = pause;
