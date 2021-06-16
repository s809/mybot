const env = require("../env");

async function help(msg) {
    const commands = require("../modules/commands");
    let response = "";

    const iterateSubcommands = (list, level = 0, fullCommand = "") => {
        for (let command of list) {
            if (command.ownerOnly && msg.channel.recipient?.id !== env.owner) continue;

            response += `${level === 0 ? env.prefix : "  ".repeat(level)}${fullCommand + command.name}`;

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
                        newFullCommand = env.prefix;
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

module.exports = {
    name: "help",
    minArgs: 0,
    maxArgs: 0,
    func: help,
}
