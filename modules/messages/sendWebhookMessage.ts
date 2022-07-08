import { HTTPError, Message, ActionRowBuilder, MessageType, TextChannel, Webhook } from "discord.js";
import { inspect } from "util";
import { log } from "../../log";

/**
 * Sends a message through webhook.
 * 
 * @param msg Message to be sent through webhook.
 * @param webhook Webhook to send message through.
 */
export async function sendWebhookMessage(msg: Message, webhook: Webhook) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            let content = msg.content;
            if (!content && msg.embeds.length === 0 && msg.attachments.size === 0) {
                if (msg.type === MessageType.Default) return;
                content = MessageType[msg.type];
            }

            return await webhook.send({
                username: `${msg.member?.nickname ? msg.member.nickname + " aka " : ""}${msg.author.tag} (${msg.author.id})`,
                avatarURL: msg.author.displayAvatarURL(),
                content: content.length ? content : undefined,
                embeds: msg.embeds.filter(embed => !embed.provider),
                files: [...msg.attachments.values()].map(att => att.url),
                components: msg.components,
                allowedMentions: {
                    parse: []
                }
            });
        }
        catch (e) {
            if (!(e instanceof HTTPError)) {
                e.message += `\nMessage length: ${msg.content.length}\nEmbeds: ${inspect(msg.embeds)}\nAttachments: ${inspect(msg.attachments)}`;
                throw e;
            }
            log(`Attempt ${attempt} to send webhook message failed: ${e.stack}`);
        }
    }
}

/**
 * Creates or finds suitable webhook and returns it.
 * 
 * @param channel
 * @returns
 */
export async function getOrCreateWebhook(channel: TextChannel) {
    const webhookName = "ChannelLink";

    let webhooks = await channel.fetchWebhooks();
    return webhooks.find(webhook => webhook.name.startsWith(webhookName) && Boolean(webhook.token)) ??
        await channel.createWebhook(`${webhookName}_${Date.now()}`);
}
