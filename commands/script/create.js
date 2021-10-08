"use strict";

import { Message } from "discord.js";
import { data } from "../../env.js";
import { getPrefix } from "../../modules/commands/getPrefix.js";
import { skipStringAfter, wrapInQuotesIfNeed } from "../../util.js";

/**
 * @param {Message} msg
 * @param {string} type
 * @param {string} scriptName
 */
async function createScript(msg, type, scriptName) {
    if (!(type in data.scripts))
        return "Invalid script type.";

    if (scriptName.match(/[/\\]/))
        return "Invalid script name.";

    if (scriptName in data.scripts[type])
        return "Script with this name already exists.";
    
    data.scripts[type][scriptName] = skipStringAfter(msg.content,
        getPrefix(msg.guildId),
        type,
        wrapInQuotesIfNeed(scriptName)
    );
}

export const name = "create";
export const minArgs = 3;
export const maxArgs = Number.MAX_VALUE;
export const func = createScript;
