"use strict";

import { Message } from "discord.js";
import { data } from "../../../env.js";

/**
 * @param {Message} msg
 * @param {string} type
 * @param {string} name
 */
async function createScript(msg, type, name) {
    if (!(type in data.scripts)) {
        await msg.channel.send("Invalid script type.");
        return false;
    }

    if (name.match(/[/\\]/)) {
        await msg.channel.send("Invalid script name.");
        return false;
    }

    if (name in data.scripts[type]) {
        await msg.channel.send("Script with this name already exists.");
        return false;
    }

    data.scripts[type][name] = msg.content.slice(msg.content.indexOf(name, msg.content.indexOf(type) + type.length) + name.length).trimStart();
    return true;
}

export const name = "create";
export const minArgs = 3;
export const maxArgs = Number.MAX_VALUE;
export const func = createScript;
