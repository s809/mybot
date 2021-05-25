const Discord = require("discord.js");
const env = require("../../env.js");

async function createServer(msg) {
    let guild;
    try {
        guild = await env.client.guilds.create("testGuild",
            {
                icon: env.client.user.displayAvatarURL(),
                defaultMessageNotifications: "MENTIONS",
                channels: [
                    {
                        name: "general"
                    },
                    {
                        name: "general-2"
                    }],
                roles: [
                    {
                        id: 0,
                        permissions: Discord.Permissions.ALL
                    }]
            });
    }
    catch (e) {
        return false;
    }

    let channel = [...guild.channels.cache.values()].find(channel => channel.type === "text");
    let invite = await channel.createInvite();
    msg.channel.send(invite.url);
    return true;
}

module.exports =
{
    name: "create",
    description: "create test server",
    minArgs: 0,
    maxArgs: 0,
    func: createServer,
}