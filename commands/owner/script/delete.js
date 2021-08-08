"use strict";

import { Message } from "discord.js";
import { data } from "../../../env.js";

/**
 * @param {Message} msg
 * @param {string} type
 * @param {string} name
 */
async function deleteScript(msg, type, name) {
    if (!(type in data.scripts)) {
        await msg.channel.send("Invalid script type.");
        return;
    }

    if (name.match(/[/\\]/)) {
        await msg.channel.send("Invalid script name.");
        return false;
    }

    if (!(name in data.scripts[type])) {
        await msg.channel.send("Script with this name does not exist.");
        return;
    }

    delete data.scripts[type][name];
    return true;
}

export const name = "delete";
export const minArgs = 2;
export const maxArgs = 2;
export const func = deleteScript;
