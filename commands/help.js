"use strict";

import { owner, prefix } from "../env.js";
import commands from "../modules/commands.js";

async function help(msg) {
    let response = "";

    const iterateSubcommands = (list, level = 0, fullCommand = "") => {
        for (let command of list) {
            if (command.ownerOnly && msg.channel.recipient?.id !== owner) continue;

            response += `${level === 0 ? prefix : "  ".repeat(level)}${fullCommand + command.name}`;

            if (command.args)
                response += " " + command.args;

            if (command.description)
                response += ` - ${command.description}.`;
            else if (command.subcommands)
                response += ":";

            response += "\n";

            if (command.subcommands) {
                let newFullCommand = fullCommand;
                if (newFullCommand.length > 0 || command.args || command.description) {
                    if (level === 0)
                        newFullCommand = prefix;
                    newFullCommand += command.name + " ";
                }

                iterateSubcommands(command.subcommands.values(), level + 1, newFullCommand);
            }
        }
    };
    iterateSubcommands(commands.values());

    await msg.channel.send(response);
    return true;
}

export const name = "help";
export const description = "show this help message";
export const func = help;
