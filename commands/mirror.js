'use strict';

const env = require("../env.js");
const util = require("../util.js");

async function mirror(msg, idArg) {
    let channel = await env.client.channels.fetch(util.mentionToChannel(idArg));

    if (env.channelData.mappedChannels.has(msg.channel.id)) {
        msg.channel.send("Channel is already mirrored.");
        return false;
    }

    if ([...env.channelData.mappedChannels.values()].includes(msg.channel.id)) {
        msg.channel.send("Cannot mirror destination channel.");
        return false;
    }

    if (env.channelData.mappedChannels.has(channel.id)) {
        msg.channel.send("Cannot mirror to mirrored channel.");
        return false;
    }

    try {
        await env.channelData.mapChannel(msg.channel, channel);

        let messages = await msg.channel.messages.fetch();
        if (messages.size > 0)
            await env.channelData.updateLastMessage(msg.channel, messages.first());

        if (msg.channel !== channel)
            channel.send(`${msg.channel} is mirrored here.`);

        return true;
    }
    catch (e) {
        msg.channel.send("Cannot access destination channel.");
        console.log(e);
        return false;
    }
}

module.exports =
{
    name: "mirror",
    description: "mirror this channel to another channel",
    args: "<channel>",
    minArgs: 1,
    maxArgs: 1,
    func: mirror,
    subcommands: require("../requireHelper.js")("./commands/mirror"),
}
