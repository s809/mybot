import Discord, { HTTPError, MessageActionRow, TextChannel } from "discord.js";
import { inspect } from "util";

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

            return await webhook.send({
                username: `${msg.member?.nickname ? msg.member.nickname + " aka " : ""}${msg.author.tag} (${msg.author.id})`,
                avatarURL: msg.author.displayAvatarURL(),
                content: content.length ? content : undefined,
                embeds: msg.embeds.filter(embed => !embed.provider),
                files: [...msg.attachments.values()].map(att => att.url),
                components: msg.components.map(x =>
                    new MessageActionRow({
                        components: x.components.map(y =>
                            y.setDisabled(true)
                        )
                    })
                ),
                disableMentions: "all"
            });
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
 * Creates or finds suitable webhook and returns it.
 * 
 * @param {TextChannel} channel
 * @returns
 */
export async function getOrCreateWebhook(channel) {
    const webhookName = "ChannelLink";

    let webhooks = await channel.fetchWebhooks();
    return webhooks.find(webhook => webhook.name.startsWith(webhookName) && webhook.token) ??
        await channel.createWebhook(`${webhookName}_${Date.now()}`);
}
