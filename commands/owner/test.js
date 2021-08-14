/**
 * @file Test code file.
 */
"use strict";

import { Message } from "discord.js";
import sendLongText from "../../modules/sendLongText.js";

/**
 * Runs test code.
 * 
 * @param {Message} msg Message. 
 * @returns {boolean} Whether execution was successful.
 */
async function test(msg) {
    await sendLongText(msg.channel, "ab".repeat(1500) + "\n" + "cd".repeat(2500));
    return true;
}

export const name = "test";
export const func = test;
