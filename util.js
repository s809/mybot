/**
 * @file Some useful functions.
 */
"use strict";

import EventEmitter from "events";

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
    // eslint-disable-next-line promise/avoid-new
    await new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Asynchronously waits for event.
 * 
 * @param {EventEmitter} emitter Emitter with event which type to wait.
 * @param {string} name Name of awaited event.
 * @returns {any} Resolved event parameters.
 */
export async function awaitEvent(emitter, name) {
    // eslint-disable-next-line promise/avoid-new
    return await new Promise(resolve => emitter.once(name, resolve));
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
 * Elevation level for managing specific command.
 * 
 * @readonly
 * @enum {string | import("discord.js").PermissionResolvable}
 */
export const CommandManagementPermissionLevel = {
    BOT_OWNER: "BOT_OWNER",
    SERVER_OWNER: "SERVER_OWNER"
};

/**
 * @typedef {object} Command
 * @property {string} name Name of a command.
 * @property {string?} path Slash-delimited path to command.
 * @property {string?} [description] Description of a command.
 * @property {string?} [args] Representation of command arguments.
 * @property {number?} [minArgs] Minimum number of arguments.
 * @property {number?} [maxArgs] Maximum number of arguments.
 * @property {CommandHandler?} [func] Handler of a command.
 * @property {Map<string, Command>?} [subcommands] Child commands.
 * @property {CommandManagementPermissionLevel?} [managementPermissionLevel] Level of elevation required to manage command permissions.
 * The command is given to users/members in level by default.
 */

/**
 * Wraps command objects into map with subcommands.
 * 
 * @param {...Command} args Commands to be wrapped.
 * @returns {Map<string, Command>} Map containing wrapped commands.
 */
export function makeSubCommands(...args) {
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
