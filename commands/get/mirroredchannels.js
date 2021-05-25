const env = require("../../env.js");

async function getMirroredChannels(msg) {
    let resp = "";

    for (let mirror of env.channelData.mappedChannels.entries()) {
        let fromChannel = await env.client.channels.fetch(mirror[0]);
        let toChannel = await env.client.channels.fetch(mirror[1].id);

        if (fromChannel.guild === msg.guild
            || toChannel.guild === msg.guild) {
            resp += `${fromChannel} (${fromChannel.guild}) => ${toChannel} (${toChannel.guild})\n`;
        }
    }

    if (resp !== "")
        msg.channel.send(resp);

    return true;
}

module.exports =
{
    name: "mirroredchannels",
    description: "get channel mirrors for this server",
    minArgs: 0,
    maxArgs: 0,
    func: getMirroredChannels,
}
