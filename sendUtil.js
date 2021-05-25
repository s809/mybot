const Discord = require('discord.js');
const env = require("./env.js");

async function sendWebhookMessage(msg, webhook) {
    for (; ;) {
        try {
            let content = msg.cleanContent;
            if (!content && msg.embeds.length === 0 && msg.attachments.size === 0) {
                if (msg.type === "DEFAULT") return;
                content = msg.type;
            }

            await webhook.send(content,
                {
                    username: msg.author.username,
                    avatarURL: msg.author.displayAvatarURL(),
                    embeds: msg.embeds.filter(embed => embed.type === "rich"),
                    files: Array.from(msg.attachments.values(), att => att.url),
                    disableMentions: "all"
                });
            break;
        }
        catch (e) {
            if (!(e instanceof Discord.HTTPError))
                throw e;
            console.log(`${e}\n${e.stack}`);
        }
    }
}

async function sendWebhookMessageAuto(msg) {
    let mChannel = await env.client.channels.fetch(env.channelData.mappedChannels.get(msg.channel.id).id);

    if (msg.channel === mChannel) {
        if (msg.webhookID) return;
        msg.delete();
    }

    try {
        let webhooks = await mChannel.fetchWebhooks();

        let webhook = webhooks.find(webhook => webhook.name === "ChannelLink");
        if (webhook === undefined)
            webhook = await mChannel.createWebhook("ChannelLink");

        await sendWebhookMessage(msg, webhook);

        await env.channelData.updateLastMessage(msg.channel, msg);
    }
    catch (e) {
        await env.channelData.unmapChannel(msg.channel);
    }
}

module.exports = {
    sendWebhookMessage: sendWebhookMessage,
    sendWebhookMessageAuto: sendWebhookMessageAuto,
}
