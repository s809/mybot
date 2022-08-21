import { GuildDefaultMessageNotifications, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { client } from "../../env";
import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition } from "../../modules/commands/definitions";

async function createServer(msg: CommandMessage) {
    let guild = await client.guilds.create({
        name: "Test Server",
        icon: client.user!.displayAvatarURL(),
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
    await msg.reply(invite.url);
}

const command: CommandDefinition = {
    key: "create",
    handler: createServer,
    alwaysReactOnSuccess: true
};
export default command;
