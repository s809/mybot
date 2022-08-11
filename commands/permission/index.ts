import assert from "assert";
import { Message } from "discord.js";
import { client, data, isBotOwner } from "../../env";
import { resolveCommand } from "../../modules/commands";
import { Command } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { InServer, isCommandAllowedToManage } from "../../modules/commands/requirements";
import { Translator } from "../../modules/misc/Translator";

async function permission(msg: Message<true>, id: string, commandPath: string) {
    let translator = Translator.getOrDefault(msg);

    let command = resolveCommand(commandPath);
    if (!command)
        return translator.translate("errors.unknown_command");
    if (!isCommandAllowedToManage(msg, command))
        return translator.translate("errors.command_management_not_allowed");

    let resolvedType: "user" | "role" | "member";

    try {
        if (msg.guild) {
            if (await msg.guild.roles.fetch(id))
                resolvedType = "role";
            else if (await msg.guild.members.fetch(id))
                resolvedType = "member";
        } else if (await client.users.fetch(id)) {
            resolvedType = "user";
        }

        assert(resolvedType!);
    }
    catch (e) {
        return translator.translate("errors.invalid_id");
    }

    let resolvedItem: {
        allowedCommands: string[];
    };
    switch (resolvedType) {
        case "user":
            // Users can only be managed by bot owner.
            if (!isBotOwner(msg.author))
                return translator.translate("errors.target_management_not_allowed");
            
            resolvedItem = data.users[id];
            break;
        case "role":
            resolvedItem = data.guilds[msg.guildId].roles[id];
            break;
        case "member":
            resolvedItem = data.guilds[msg.guildId].members[id];
            break;
    }

    if (!resolvedItem.allowedCommands.includes(commandPath))
        resolvedItem.allowedCommands.push(commandPath);
    else
        resolvedItem.allowedCommands.splice(resolvedItem.allowedCommands.indexOf(commandPath));
}

const command: Command = {
    name: "permission",
    args: [2, 2, "<id> <permission>"],
    requirements: InServer,
    func: permission,
    alwaysReactOnSuccess: true,
    subcommands: await importCommands(import.meta.url)
};
export default command;
