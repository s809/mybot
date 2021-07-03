"use strict";

import { HTTPError } from "discord.js";
import { client, channelData } from "./env.js";

export async function sendWebhookMessage(msg, webhook) {
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
            if (!(e instanceof HTTPError))
                throw e;
            console.log(`${e}\n${e.stack}`);
        }
    }
}

export async function sendWebhookMessageAuto(msg) {
    let mChannel = await client.channels.fetch(channelData.mappedChannels.get(msg.channel.id).id);

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

        await channelData.updateLastMessage(msg.channel, msg);
    }
    catch (e) {
        await channelData.unmapChannel(msg.channel);
    }
}

export async function sendLongText(channel, text) {
    text = text.replaceAll("```", "\\`\\`\\`");

    const maxMessageLength = 2000;
    const back = "◀", stop = "✖", forward = "▶";

    // Text fits in one message
    if (text.length < maxMessageLength - (3 * 2 + 3)) {
        await channel.send("```js\n" + text + "```");
        return;
    }

    let page = 0;
    const pagecount = Math.ceil((text.length - 1) / maxMessageLength);

    // Split text into multiple messages
    const header = "Page %page% of %pagecount%:\n```js\n%content% ```";
    let start = 0;
    let pages = [];
    while (start < text.length) {
        let nocontent = header.replace("%page%", ++page).replace("%pagecount%", pagecount);
        let end = start + maxMessageLength - nocontent.replace("%content%", "").length;
        let content = text.substring(start, end);

        let isTrailingEscape = !!content.match(/(?<!\\)\\(\\\\)*$/);
        if (isTrailingEscape)
            content = text.substring(start, end - 1);

        pages.push(nocontent.replace("%content%", content));

        start += content.length;
    }
    page = 0;

    let msg = await channel.send(pages[page]);
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
                await msg.edit(pages[page]);
                break;
            case stop:
                collector.stop();
                break;
            case forward:
                page = Math.min(page + 1, pagecount - 1);
                await msg.edit(pages[page]);
                break;
        }

        await reaction.users.remove(user);
    });

    collector.on("end", async () => await msg.reactions.removeAll());
}
