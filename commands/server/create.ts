import { GuildDefaultMessageNotifications, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { client } from "../../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function createServer(msg: CommandRequest) {
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

export default defineCommand({
    key: "create",
    handler: createServer,
});
