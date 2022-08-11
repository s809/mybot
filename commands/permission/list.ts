import assert from "assert";
import { GuildMember, Message, Role, User } from "discord.js";
import { client, data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function permissionList(msg: Message, id: string = msg.author.id) {
    let translator = Translator.getOrDefault(msg);

    let resolvedType: "user" | "role" | "member";
    let resolvedItem;

    try {
        if (msg.inGuild()) {
            resolvedItem = await msg.guild.roles.fetch(id);
            if (resolvedItem) {
                resolvedType = "role";
            }
            else {
                resolvedItem = await msg.guild.members.fetch(id);
                if (resolvedItem)
                    resolvedType = "member";
            }
        } else {
            resolvedItem = await client.users.fetch(id);
            if (resolvedItem)
                resolvedType = "user";
        }

        assert(resolvedType!);
    }
    catch (e) {
        return translator.translate("errors.invalid_id");
    }

    let userCommands: string[] | undefined;
    let roleCommands: string[] | undefined;
    let memberCommands: string[] | undefined;

    switch (resolvedType) {
        case "user":
            userCommands = data.users[id]?.allowedCommands ?? [];
            break;
        case "role":
            roleCommands = data.guilds[msg.guildId!].roles[id].allowedCommands;
            break;
        case "member":
            userCommands = data.users[id].allowedCommands;
            roleCommands = (await msg.guild!.members.fetch(id)).roles.cache
                .map(role => data.guilds[msg.guildId!].roles[role.id].allowedCommands
                    .map((x: string) => `${role.toString()} - ${x}`)
                ).flat();
            memberCommands = data.guilds[msg.guildId!].members[id].allowedCommands;
            break;
    }

    let fields = [];
    if (userCommands?.length) {
        fields.push({
            name: translator.translate("embeds.permission_list.user"),
            value: userCommands.join("\n")
        });
    }
    if (roleCommands?.length) {
        fields.push({
            name: translator.translate("embeds.permission_list.role"),
            value: roleCommands.join("\n")
        });
    }
    if (memberCommands?.length) {
        fields.push({
            name: translator.translate("embeds.permission_list.member"),
            value: memberCommands.join("\n")
        });
    }

    await msg.channel.send({
        embeds: [{
            title: translator.translate("embeds.permission_list.title",
                (resolvedItem as Role).name ??
                (resolvedItem as GuildMember).user?.tag ??
                (resolvedItem as User).tag),
            ...fields.length
                ? {
                    fields: fields,
                }
                : {
                    description: translator.translate("embeds.permission_list.no_permissions")
                }
        }]
    });
}

const command: Command = {
    name: "list",
    args: [0, 1, "[id]"],
    func: permissionList
};
export default command;
