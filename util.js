/**
 * @file Some useful functions.
 */
"use strict";

import Discord from "discord.js";

/**
 * Clamps value {@link num} to max of {@link max}.
 * 
 * @param {number} num Value to be clamped.
 * @param {number} max Largest allowed value.
 * @returns {number} Clamped value.
 * @example clamp(10, 100);
 */
export function clamp(num, max) { 
    return num > max ? max : num; 
}

/**
 * Sleeps for provided amount of time.
 * 
 * @param {number} delayMs Sleep time in milliseconds.
 * @example sleep(1000);
 */
export async function sleep(delayMs) { 
    await new Promise(resolve => setTimeout(resolve, delayMs)); 
}

/**
 * Extracts channel ID from channel mention.
 * 
 * @param {string} text Channel mention.
 * @returns {string?} Channel ID.
 * @example mentionToChannel("<#714193973509357600>");
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
 * 
 * @param {...Command} args Commands to be wrapped.
 * @returns {Map<string, Command>} Map containing wrapped commands.
 * @example makeSubCommands(cmd1, cmd2, cmd3);
 */
export function makeSubCommands(...args)
{
    let map = new Map();

    for (let arg of args)
        map.set(arg.name, arg);
    
    return map;
}

/**
 * Wraps text in titled borders.
 * 
 * @param {string} title Title for wrapping.
 * @param {string} text Text to wrap.
 * @returns {string} Wrapped text.
 */
export function wrapText(title, text) {
    title = title.toUpperCase();

    return `----- ${title} -----\n` +
           text + 
           `\n----- END ${title} -----`;
}
