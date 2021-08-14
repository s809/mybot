"use strict";

import { Message } from "discord.js";
import { data } from "../../../env.js";
import sendLongText from "../../../modules/sendLongText.js";

/**
 * @param {Message} msg
 */
async function listScripts(msg) {
    let str = "";

    for (let type of Object.keys(data.scripts)) {
        str += `${type}:\n`;

        for (let name of Object.getOwnPropertyNames(data.scripts[type])) {
            str += `- ${name}\n`;
        }
    }

    await sendLongText(msg.channel, str.slice(0, -1));
    return true;
}

export const name = "list";
export const minArgs = 0;
export const maxArgs = 0;
export const func = listScripts;
