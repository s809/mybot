const env = require("../../env.js");

async function removeMirror(msg) {
    let channel, fromChannel = msg.channel;
    if (env.channelData.mappedChannels.has(fromChannel.id)) {
        channel = await env.client.channels.fetch(env.channelData.mappedChannels.get(fromChannel.id).id);
    }
    else {
        channel = [...env.channelData.mappedChannels.entries()].find(entry => entry[1].id === fromChannel.id);
        if (channel) {
            let tmp = fromChannel;
            fromChannel = await env.client.channels.fetch(channel[0]);
            channel = tmp;
        }
        else {
            msg.channel.send("Channel is not mirrored nor any channel is mirroring to it.");
            return false;
        }
    }

    let webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.name === "ChannelLink");

    if (webhook !== undefined) webhook.delete();
    await env.channelData.unmapChannel(fromChannel);

    if (fromChannel !== channel) channel.send(`${fromChannel} is no longer mirrored.`);

    return true;
}

module.exports =
{
    name: "remove",
    description: "stop mirroring to/from this channel",
    minArgs: 0,
    maxArgs: 0,
    func: removeMirror,
}
