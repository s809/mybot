const env = require("../../env.js");

async function resetChannel(msg) {
    if (env.channelData.mappedChannels.has(msg.channel) || [...env.channelData.mappedChannels.values()].includes(msg.channel)) {
        msg.channel.send("Unmirror channel first.");
        return false;
    }

    let channel = await msg.channel.clone();
    channel.setPosition(msg.channel.position);
    msg.channel.delete();
    return true;
}

module.exports =
{
    name: "reset",
    description: "clone and delete this channel",
    minArgs: 0,
    maxArgs: 0,
    func: resetChannel,
}