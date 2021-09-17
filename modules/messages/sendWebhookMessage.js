"use strict";

import Discord, { HTTPError, TextChannel } from "discord.js";
import { inspect } from "util";
import { client, data } from "../../env.js";

/**
 * Sends a message through webhook.
 * 
 * @param {Discord.Message} msg Message to be sent through webhook.
 * @param {Discord.Webhook} webhook Webhook to send message through.
 */
export async function sendWebhookMessage(msg, webhook) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            let content = msg.content;
            if (!content && msg.embeds.length === 0 && msg.attachments.size === 0) {
                if (msg.type === "DEFAULT") return;
                content = msg.type;
            }

            await webhook.send({
                username: msg.author.username,
                avatarURL: msg.author.displayAvatarURL(),
                content: content.length ? content : undefined,
                embeds: msg.embeds.filter(embed => !embed.provider),
                files: Array.from(msg.attachments.values(), att => att.url),
                disableMentions: "all"
            });
            break;
        }
        catch (e) {
            if (!(e instanceof HTTPError)) {
                e.message += `\nMessage length: ${msg.content.length}\nEmbeds: ${inspect(msg.embeds)}\nAttachments: ${inspect(msg.attachments)}`;
                throw e;
            }
            console.log(`Attempt ${attempt} to send webhook message failed: ${e.stack}`);
        }
    }
}

/**
 * Sends a message through auto-selected webhook.
 * 
 * @param {Discord.Message} msg Message to be sent through webhook.
 */
export async function sendWebhookMessageAuto(msg) {
    /** @type {import("../data/channelLinking.js").ChannelLink} */
    let link = data.guilds[msg.guild.id].channels[msg.channelId].link;
    /** @type {TextChannel} */
    let destChannel = await client.channels.fetch(link.channelId);

    if (msg.channel === destChannel) {
        if (msg.webhookId) return;
        await msg.delete();
    }

    try {
        let webhooks = await destChannel.fetchWebhooks();

        let webhook = webhooks.find(webhook => webhook.name === "ChannelLink") ??
            await destChannel.createWebhook("ChannelLink");

        await sendWebhookMessage(msg, webhook);

        link[msg.channel.id].lastMessageId = msg.id;
    }
    catch (e) {
        link[msg.channel.id] = undefined;
    }
}
