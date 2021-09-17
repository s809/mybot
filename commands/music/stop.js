/**
 * @file Command for stopping playback.
 */
"use strict";

import Discord from "discord.js";
import { musicPlayingGuilds } from "../../env.js";

/**
 * Stops playback.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 */
async function stop(msg) {
    if (!musicPlayingGuilds.has(msg.guild)) {
        await msg.channel.send("Nothing is not playing here.");
        return false;
    }

    let entry = musicPlayingGuilds.get(msg.guild);

    entry.queue = [];
    entry.readable.destroy();
    entry.player.unpause();

    return true;
}

export const name = "stop";
export const description = "stop player";
export const func = stop;
