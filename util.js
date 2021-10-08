/**
 * @file Some useful functions.
 */
"use strict";

import EventEmitter from "events";
import { botDirectory } from "./env.js";

/**
 * Clamps value {@link num} to max of {@link max}.
 * 
 * @param {number} num Value to be clamped.
 * @param {number} max Largest allowed value.
 * @returns {number} Clamped value.
 */
export function clamp(num, max) {
    return num > max ? max : num;
}

/**
 * Sleeps for provided amount of time.
 * 
 * @param {number} delayMs Sleep time in milliseconds.
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
 */
export function mentionToChannel(text) {
    return /^<#(\d+)>$/.test(text) ? text.match(/^<#(\d+)>$/)[1] : null;
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

/**
 * Removes paths to bot in string.
 * 
 * @param {string} text Text with paths to be sanitized.
 * @returns {string} Sanitized text.
 */
export function sanitizePaths(text) {
    return text.replaceAll(botDirectory, ".").replaceAll("file://", "");
}

/**
 * Formats duration, stripping hour part if not in use.
 * 
 * @param {*} duration Duration in seconds.
 * @returns {string} Formatted duration.
 */
export function formatDuration(duration) {
    var hours = Math.floor(duration / 3600);
    var minutes = Math.floor((duration - (hours * 3600)) / 60);
    var seconds = Math.floor(duration - (hours * 3600) - (minutes * 60));

    if (hours !== 0 && hours < 10)
        hours = "0" + hours + ":";
    if (minutes < 10)
        minutes = "0" + minutes;
    if (seconds < 10)
        seconds = "0" + seconds;
    
    return (hours ? hours : "") + minutes + ":" + seconds;
}

/**
 * Skips string past specified parts and removes leading whitespace.
 * 
 * @param {string} text String to skip in.
 * @param {...string} parts Parts to skip.
 * @returns String with skipped parts.
 */
export function skipStringAfter(text, ...parts) {
    for (let part of parts)
        text = text.slice(text.indexOf(part) + part.length).trimStart();
    
    return text;
}

/**
 * Wraps string in quotes if it has whitespace in it.
 * 
 * @param {string} text Text to wrap.
 * @returns Wrapped text.
 */
export function wrapInQuotesIfNeed(text) {
    if (text.match(/\s/))
        return `"${text}"`;
    else
        return text;
}
