const env = require("../../env.js");

function delAllServers() {
    for (let guild of env.client.guilds.cache.values()) {
        if (guild.ownerID !== env.client.user.id) continue;

        guild.delete();
    }
    return true;
}

module.exports =
{
    name: "delall",
    description: "delete all test servers",
    minArgs: 0,
    maxArgs: 0,
    func: delAllServers,
}