"use strict";

import { Message } from "discord.js";
import { data } from "../../env.js";

/**
 * @param {Message} msg
 * @param {string} type
 * @param {string} name
 */
async function deleteScript(msg, type, name) {
    if (!(type in data.scripts))
        return "Invalid script type.";

    if (name.match(/[/\\]/))
        return "Invalid script name.";

    if (!(name in data.scripts[type]))
        return "Script with this name does not exist.";

    delete data.scripts[type][name];
}

export const name = "delete";
export const minArgs = 2;
export const maxArgs = 2;
export const func = deleteScript;
