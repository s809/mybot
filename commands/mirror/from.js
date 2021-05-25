const env = require("../../env.js");
const util = require("../../util.js");

async function addMirrorFrom(msg, idArg, isSilentArg) {
    if (isSilentArg !== undefined && isSilentArg !== "silent") {
        msg.channel.send("Invalid argument.");
        return false;
    }

    let channel = await env.client.channels.fetch(util.mentionToChannel(idArg));

    if (env.channelData.mappedChannels.has(channel.id)) {
        msg.channel.send("Channel is already mirrored.");
        return false;
    }

    if ([...env.channelData.mappedChannels.values()].includes(channel.id)) {
        msg.channel.send("Cannot mirror destination channel.");
        return false;
    }

    if (env.channelData.mappedChannels.has(msg.channel.id)) {
        msg.channel.send("Cannot mirror to mirrored channel.");
        return false;
    }

    try {
        if (msg.channel !== channel && isSilentArg === undefined)
            channel.send(`This channel is mirrored to ${msg.channel}.`);
    }
    catch (e) {
        msg.channel.send("Cannot access source channel.");
        return false;
    }

    return await require("../mirror.js").func({ channel: channel }, msg.channel.toString());
}

module.exports =
{
    name: "from",
    description: "mirror another channel to this channel",
    args: "<channel> <(optional)silent>",
    minArgs: 1,
    maxArgs: 2,
    func: addMirrorFrom,
}
