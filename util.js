"use strict";

import Discord from "discord.js";

export function clamp(num, max) { 
    return num > max ? max : num; 
}

export async function sleep(delayMs) { 
    await new Promise(resolve => setTimeout(resolve, delayMs)); 
}

/**
 * Extracts channel ID from channel mention.
 * @param {string} text Channel mention.
 * @returns {string?} Channel ID.
 */
export function mentionToChannel(text) {
    return /^<#(\d+)>$/.test(text) ? text.match(/^<#(\d+)>$/)[1] : null;
}

/**
 * @callback CommandHandler
 * @param {Discord.Message} msg Message the command was sent from.
 * @param {...string} args Command arguments.
 * @returns {Promise<boolean>} Whether execution was successful.
 */

/**
 * @typedef {object} Command
 * @property {string} name Name of a command.
 * @property {string} [description] Description of a command.
 * @property {string} [args] Representation of command arguments.
 * @property {number} [minArgs] Minimum number of arguments.
 * @property {number} [maxArgs] Maximum number of arguments.
 * @property {CommandHandler} [func] Handler of a command.
 * @property {Map<string, Command>} [subcommands] Child commands.
 * @property {boolean} [ownerOnly] Whether command is only for owner.
 */

/**
 * Wraps command objects into map with subcommands.
 * @param {...Command} args
 * @returns {Map<string, Command>}
 */
export function makeSubCommands()
{
    let map = new Map();

    for (let arg of arguments)
        map.set(arg.name, arg);
    
    return map;
}
