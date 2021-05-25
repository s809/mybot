const env = require("../../env.js");

async function getOwnedServers(msg) {
    let resp = "";

    for (let guild of env.client.guilds.cache.values()) {
        if (guild.ownerID !== env.client.user.id) continue;

        let channel = [...guild.channels.cache.values()].find(channel => channel.type === "text");
        let invite = await channel.createInvite();
        resp += invite.url + "\n";
    }

    if (resp !== "")
        msg.channel.send(resp);

    return true;
}

module.exports =
{
    name: "ownedservers",
    description: "list bot test servers",
    minArgs: 0,
    maxArgs: 0,
    func: getOwnedServers,
}
