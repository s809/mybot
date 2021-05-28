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

async function sendLongText(channel, text) {
    text = text.replace(/(\*|_|`|~|\\)/g, '\\$1');

    if (text.length < 2000 - 3 * 2) {
        await channel.send("```" + text + "```");
        return;
    }

    let page = 0;
    const pagecount = Math.ceil((text.length - 1) / 2000);

    const header = "Page %page% of %pagecount%\n```%content%```";
    const getMessage = () => {
        let start = page * 2000
            - header.replace(/%.*?%/g, "").length * page // header without placeholders
            - Array(page).fill().map((x, i) => i + 1).join("").length // page placeholder
            - pagecount.toString().length * page // pagecount placeholder

        let nocontent = header.replace("%page%", page + 1).replace("%pagecount%", pagecount);

        let end = start + 2000 - nocontent.replace("%content%", "").length;

        return nocontent.replace("%content%", text.substring(start, end));
    }

    let msg = await channel.send(getMessage());

    const back = "◀", stop = "✖", forward = "▶";
    await msg.react(back);
    await msg.react(stop);
    await msg.react(forward);

    let collector = msg.createReactionCollector(
        reaction => [back, stop, forward].includes(reaction.emoji.name),
        { idle: 60000 });

    collector.on("collect", async (reaction, user) => {
        switch (reaction.emoji.name) {
            case back:
                page = Math.max(page - 1, 0);
                await msg.edit(getMessage());
                break;
            case stop:
                collector.stop();
                break;
            case forward:
                page = Math.min(page + 1, pagecount - 1);
                await msg.edit(getMessage());
                break;
        }

        await reaction.users.remove(user);
    });

    collector.on("end", async () => await msg.reactions.removeAll());
}

module.exports = {
    sendWebhookMessage: sendWebhookMessage,
    sendWebhookMessageAuto: sendWebhookMessageAuto,
    sendLongText: sendLongText,
}
