/**
 * @file Test code file.
 */
"use strict";

import { Message } from "discord.js";
import { sendLongText } from "../../sendUtil.js";

/**
 * Runs test code.
 * 
 * @param {Message} msg Message. 
 * @returns {boolean} Whether execution was successful.
 * @example test(msg);
 */
async function test(msg) {
    await sendLongText(msg.channel, "abcd_".repeat(3500));
    return true;
}

export const name = "test";
export const func = test;
