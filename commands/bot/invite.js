const Discord = require("discord.js");
const env = require("../../env.js");

async function botInvite(msg) {
    msg.channel.send(await env.client.generateInvite(Discord.Permissions.FLAGS.ALL));
    return true;
}

module.exports =
{
    name: "invite",
    description: "get bot server invite link",
    minArgs: 0,
    maxArgs: 0,
    func: botInvite,
}
