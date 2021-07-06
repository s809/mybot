/**
 * @file Restart command.
 */
"use strict";

import { execSync } from "child_process";
import { Message } from "discord.js";
import { client } from "../../env.js";

/**
 * Update and restart bot.
 * 
 * @param {Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 * @example restart(msg);
 */
async function restart(msg) {
    execSync("git pull && npm ci && ./mybot.sh --nokill");

    await Promise.all([
        msg.reactions.cache.find(x => x.emoji === "🔄" && x.users.resolve(client.user))?.users.remove(),
        msg.react("✅")
    ]);
    process.exit();
}

export const name = "restart";
export const func = restart;
