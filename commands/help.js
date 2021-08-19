"use strict";

import { Message } from "discord.js";
import { prefix } from "../env.js";
import commands, { iterateCommands } from "../modules/commands.js";
import { isCommandAllowedToUse } from "../modules/permissions.js";
import sendLongText from "../modules/sendLongText.js";
import { CommandManagementPermissionLevel } from "../util.js";

/**
 * @param {Message} msg
 */
async function help(msg) {
    let response = "";

    /** @type {string[]} */
    let fullCommand = [];

    for (let command of iterateCommands()) {
        if (!isCommandAllowedToUse(msg, command) ||
            command.managementPermissionLevel === CommandManagementPermissionLevel.BOT_OWNER)
            continue;

        const currentPath = command.path.split("/");
        const indent = "  ".repeat(currentPath.length - 1);

        if (fullCommand.length >= currentPath.length)
            fullCommand = [];

        response += indent.length
            ? indent
            : prefix;
        
        if (fullCommand.length)
            response += prefix + fullCommand.join(" ") + " ";
        
        response += command.name;

        if (command.args)
            response += " " + command.args;

        if (command.description) {
            response += ` - ${command.description.split("\n").join("\n  " + indent)}.`;
            fullCommand = command.path.split("/");
        }
        else if (command.subcommands)
            response += ":";

        response += "\n";
    }

    await sendLongText(msg.channel, response, {
        code: ""
    });
    return true;
}

export const name = "help";
export const description = "show this help message";
export const func = help;
