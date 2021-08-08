"use strict";

import { Message } from "discord.js";
import { data, prefix } from "../../../env.js";
import botEval from "../../../modules/eval.js";

/**
 * @param {Message} msg
 * @param {string} name
 */
async function runScript(msg, name) {
    if (name.match(/[/\\]/)) {
        await msg.channel.send("Invalid script name.");
        return false;
    }

    if (!(name in data.scripts.callable)) {
        await msg.channel.send("Script with this name does not exist.");
        return;
    }

    await botEval({
        content: prefix + data.scripts.callable[name],
        delete: msg.delete,
        channel: msg.channel,
        guild: msg.guild,
        client: msg.client,
    });
    return true;
}

export const name = "run";
export const minArgs = 1;
export const maxArgs = 1;
export const func = runScript;
