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
