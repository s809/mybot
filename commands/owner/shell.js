"use strict";

import { exec as _exec } from "child_process";
import { promisify } from "util";
const exec = promisify(_exec);
import sendLongText from "./../../modules/messages/sendLongText.js";

async function shell(msg) {
    let command = `"${[...arguments].slice(1).join("\" \"")}"`;
    let { stdout, stderr } = await exec(command, { encoding: "utf8" });
    await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
    await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
    return true;
}

export const name = "shell";
export const minArgs = 1;
export const maxArgs = Infinity;
export const func = shell;
