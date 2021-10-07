"use strict";

import { exec as _exec } from "child_process";
import { promisify } from "util";
const exec = promisify(_exec);
import sendLongText from "./../../modules/messages/sendLongText.js";

/**
 * @param {import("discord.js").Message} msg 
 */
async function shell(msg) {
    let command = msg.content.slice(msg.content.indexOf(name) + name.length).trimStart();
    let { stdout, stderr } = await exec(command, { encoding: "utf8" });
    
    if (stdout.length)
        await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
    if (stderr.length)
        await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
}

export const name = "shell";
export const minArgs = 1;
export const maxArgs = Infinity;
export const func = shell;
