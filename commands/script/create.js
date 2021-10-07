"use strict";

import { Message } from "discord.js";
import { data } from "../../env.js";

/**
 * @param {Message} msg
 * @param {string} type
 * @param {string} name
 */
async function createScript(msg, type, name) {
    if (!(type in data.scripts))
        return "Invalid script type.";

    if (name.match(/[/\\]/))
        return "Invalid script name.";

    if (name in data.scripts[type])
        return "Script with this name already exists.";

    data.scripts[type][name] = msg.content.slice(msg.content.indexOf(name, msg.content.indexOf(type) + type.length) + name.length).trimStart();
}

export const name = "create";
export const minArgs = 3;
export const maxArgs = Number.MAX_VALUE;
export const func = createScript;
