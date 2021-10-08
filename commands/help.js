"use strict";

import { Message } from "discord.js";
import { iterateCommands } from "../modules/commands/commands.js";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";
import { getPrefix } from "../modules/commands/getPrefix.js";
import { isCommandAllowedToUse } from "../modules/commands/permissions.js";
import sendLongText from "../modules/messages/sendLongText.js";

/**
 * @param {Message} msg
 */
async function help(msg) {
    let response = "";

    /** @type {("Short" | "FullKeepIndent" | "Full")[]} */
    let commandGenHintChain = [];

    /**
     * @type {import("../util.js").Command}
     */
    let command;
    for (command of iterateCommands()) {
        const currentPath = command.path.split("/");

        if (currentPath.length && commandGenHintChain.length >= currentPath.length)
            commandGenHintChain = commandGenHintChain.slice(0, currentPath.length - 1);

        if (!isCommandAllowedToUse(msg, command)) {
            commandGenHintChain.push("Full");
            continue;
        }

        if (command.managementPermissionLevel === CommandManagementPermissionLevel.BOT_OWNER &&
            !msg.channel.recipient)
            continue;

        const indentLevel = Math.max(
            commandGenHintChain.lastIndexOf("Short"),
            commandGenHintChain.lastIndexOf("FullKeepIndent")
        ) + 1;
        const indent = "  ".repeat(indentLevel);
        response += indent;

        if (!commandGenHintChain.length || commandGenHintChain[commandGenHintChain.length - 1] !== "Short")
            response += getPrefix(msg.guildId) + currentPath.join(" ");
        else
            response += command.name;

        if (command.args || command.description) {
            commandGenHintChain.push("FullKeepIndent");
        }
        else {
            commandGenHintChain.push("Short");
            if (command.subcommands)
                response += ":";
        }

        if (command.args)
            response += " " + command.args;

        if (command.description)
            response += ` - ${command.description.split("\n").join("\n  " + indent)}.`;

        response += "\n";
    }

    await sendLongText(msg.channel, response, {
        code: ""
    });
}

export const name = "help";
export const description = "show this help message";
export const func = help;
