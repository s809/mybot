import { GuildDefaultMessageNotifications, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";

async function createServer(msg: Message) {
    let guild = await client.guilds.create("testGuild", {
        icon: client.user.displayAvatarURL(),
        defaultMessageNotifications: GuildDefaultMessageNotifications.OnlyMentions,
        channels: [{
            name: "general"
        }, {
            name: "general-2"
        }],
        roles: [{
            id: 0,
            permissions: Object.values(PermissionFlagsBits)
        }]
    });

    let channel = [...guild.channels.cache.values()].find(channel => channel instanceof TextChannel) as TextChannel;
    let invite = await channel.createInvite();
    await msg.channel.send(invite.url);
}

const command: Command = {
    name: "create",
    func: createServer
};
export default command;
