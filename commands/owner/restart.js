/**
 * @file Restart command.
 */
"use strict";

import { execSync } from "child_process";
import { Message } from "discord.js";
import { writeFileSync } from "fs";
import { data, isDebug } from "../../env.js";

/**
 * Update and restart bot.
 * 
 * @param {Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 * @example restart(msg);
 */
async function restart(msg) {
    data.saveDataSync();
    if (!isDebug)
        execSync("git pull && npm install && ./mybot.sh --nokill");

    await msg.react("✅");
    process.exit();
}

export const name = "restart";
export const func = restart;
