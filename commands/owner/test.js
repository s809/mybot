/**
 * @file Test code file.
 */
import { Message } from "discord.js";
import sendLongText from "../../modules/messages/sendLongText.js";

/**
 * Runs test code.
 * 
 * @param {Message} msg Message.
 * @returns {boolean} Whether execution was successful.
 */
async function test(msg) {
    await sendLongText(msg.channel, "ab".repeat(1500) + "\n" + "cd".repeat(2500));
}

export const name = "test";
export const func = test;
