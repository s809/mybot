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
 * @returns {Promise<never>}
 */
async function restart(msg) {
    data.saveDataSync();

    if (!isDebug)
        execSync("git pull && npm install");
    if (process.argv.includes("--started-by-script"))
        execSync("./mybot.sh --nokill");

    await msg.react("✅");
    process.exit();
}

export const name = "restart";
export const func = restart;
