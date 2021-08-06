/**
 * @file Provides utility functions for sending messages.
 */
"use strict";

import Discord, { HTTPError, MessageButton, MessageActionRow, Message } from "discord.js";
import { inspect } from "util";
import { client, data } from "./env.js";

const title = "Page %page% of %pagecount%";
const separator = ":\n";
const contentWrap = "```%code%\n%content% ```";

const maxMessageLength = 2000;
const back = "◀", stop = "✖", forward = "▶";

/**
 * Sends a message through webhook.
 * 
 * @param {Discord.Message} msg Message to be sent through webhook.
 * @param {Discord.Webhook} webhook Webhook to send message through.
 * @example sendWebhookMessage(msg, webhook);
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
 * @example sendWebhookMessageAuto(msg, webhook);
 */
export async function sendWebhookMessageAuto(msg) {
    let mappedChannels = data.guilds[msg.guild.id].mappedChannels;
    let mChannel = await client.channels.fetch(mappedChannels[msg.channel.id].id);

    if (msg.channel === mChannel) {
        if (msg.webhookID) return;
        await msg.delete();
    }

    try {
        let webhooks = await mChannel.fetchWebhooks();

        let webhook = webhooks.find(webhook => webhook.name === "ChannelLink");
        if (webhook === undefined)
            webhook = await mChannel.createWebhook("ChannelLink");

        await sendWebhookMessage(msg, webhook);

        mappedChannels[msg.channel.id].lastMessageId = msg.id;
    }
    catch (e) {
        mappedChannels[msg.channel.id] = undefined;
    }
}

/**
 * Prepare pages for sending.
 * 
 * @param {string} text Text to prepare.
 * Must contain %content% and optionally %page% and %pagecount%.
 * @param {string} textWrap Text for wrapping pages.
 * @returns {string[]} Array of prepared pages of text.
 * @example prepareLongText(text, textWrap, maxMessageLength);
 */
function prepareLongText(text, textWrap) {
    // Not exact value, but enough to briefly estimate page count
    const pagecount = Math.ceil((text.length - 1) / maxMessageLength);

    let page = 0, start = 0;
    let pages = [];
    while (start < text.length) {
        let wrapReplacedOnly = textWrap.replace("%page%", ++page).replace("%pagecount%", pagecount);
        let end = start + maxMessageLength - (wrapReplacedOnly.length - "%content%".length);
        let content = text.substring(start, end);
        
        // Remove trailing escape character
        if (content.match(/(?<!\\)\\(\\\\)*$/))
            content = text.substring(start, end - 1);

        pages.push(wrapReplacedOnly.replace("%content%", content));

        start += content.length;
    }

    return pages;
}

/**
 * Send message with embed buttons for page switching.
 * 
 * @param {Discord.Channel} channel Channel in which to send a message.
 * @param {string[]} pages Array of page texts.
 * @param {boolean} embed Whether to wrap text in an embed. 
 * @example sendPagedTextWithButtons(channel, pages, embed);
 */
async function sendPagedTextWithButtons(channel, pages, embed) {
    let backButton = new MessageButton({
        customId: "back_button",
        style: "PRIMARY",
        emoji: back,
        disabled: true
    });

    let stopButton = new MessageButton({
        customId: "stop_button",
        style: "DANGER",
        emoji: stop
    });

    let forwardButton = new MessageButton({
        customId: "forward_button",
        style: "PRIMARY",
        emoji: forward
    });

    /** @type {import("discord.js").MessageOptions} */
    let options = {
        components: [
            new MessageActionRow()
                .addComponents(backButton, stopButton, forwardButton)
        ]
    };
    if (embed)
    {
        options.embeds = [{
            title: title.replace("%page%", 1).replace("%pagecount%", pages.length),
            description: pages[0],
        }];
    }
    else {
        options.content = pages[0];
    }
    
    /** @type {Message} */
    let msg = await channel.send(options);

    let page = 0;
    const editMsg = async () =>
    {
        options.components = [
            new MessageActionRow()
                .addComponents(backButton, stopButton, forwardButton)
        ];
        if (embed)
        {
            options.embeds = [{
                title: title.replace("%page%", page + 1).replace("%pagecount%", pages.length),
                description: pages[page],
            }];
        }
        else {
            options.content = pages[page];
        }
        await msg.edit(options);
    };
    
    let collector = msg.createMessageComponentCollector(() => true, { idle: 60000 });
    collector.on("collect", async interaction => {
        await interaction.deferUpdate();

        switch (interaction.customId) {
            case backButton.customId:
                page = Math.max(page - 1, 0);
                break;
            case stopButton.customId:
                collector.stop();
                return;
            case forwardButton.customId:
                page = Math.min(page + 1, pages.length - 1);
                break;
        }
        
        backButton.setDisabled(page === 0);
        forwardButton.setDisabled(page === pages.length - 1);

        await editMsg();
    });

    await new Promise(resolve => collector.on("end", resolve));

    backButton.setDisabled(true);
    stopButton.setDisabled(true);
    forwardButton.setDisabled(true);
    await editMsg();
}

/**
 * Send message with reactions for page switching.
 * 
 * @param {Discord.TextChannel} channel Channel in which to send a message.
 * @param {string[]} pages Array of page texts.
 * @param {boolean} embed Whether to wrap text in an embed. 
 * @example sendPagedTextWithButtons(channel, pages, embed);
 */
async function sendPagedTextWithReactions(channel, pages, embed) {
    /** @type {Discord.Message} */
    let msg = await channel.send(embed ? {
        embeds: [{
            title: title.replace("%page%", 1).replace("%pagecount%", pages.length),
            description: pages[0],
        }]
    } : pages[0]);

    await msg.react(back);
    await msg.react(stop);
    await msg.react(forward);

    let collector = msg.createReactionCollector(
        reaction => [back, stop, forward].includes(reaction.emoji.name),
        { idle: 60000 });

    let page = 0;
    collector.on("collect", async (reaction, user) => {
        switch (reaction.emoji.name) {
            case back:
                page = Math.max(page - 1, 0);
                break;
            case stop:
                collector.stop();
                return;
            case forward:
                page = Math.min(page + 1, pages.length - 1);
                break;
        }

        await Promise.all([
            msg.edit(embed ? {
                embeds: [{
                    title: title.replace("%page%", page + 1).replace("%pagecount%", pages.length),
                    description: pages[page],
                }]
            } : pages[page]),
            reaction.users.remove(user)
        ]);
    });

    collector.on("end", async () => await msg.reactions.removeAll());
}

/**
 * Sends text, splitting and adding page buttons if necessary.
 * 
 * @param {Discord.TextChannel} channel Channel to send a message.
 * @param {string} text Text to send.
 * @param {string?} code Language for optional code block wrapping.
 * @param {boolean} embed Whether to wrap text in an embed.
 * @param {boolean} useReactions Whetner to use reactions instead of embed buttons.
 * @example sendLongText(msg.channel, "super long text", code = false, embed = false);
 */
export async function sendLongText(channel, text, code = "js", embed = true, useReactions = false) {
    text = text.replaceAll("```", "\\`\\`\\`");

    const contentWrapWithCode = contentWrap.replace("%code%", code);

    let textWrap = code !== null ? contentWrapWithCode : "%content%";
    if (!embed)
        textWrap = title + separator + textWrap;

    // Text fits in one message
    if (text.length < maxMessageLength - (contentWrapWithCode.length - "%content%".length)) {
        await channel.send(embed ? {
            embeds: [{
                description: contentWrapWithCode.replace("%content%", text),
            }]
        } : contentWrapWithCode.replace("%content%", text));
        return;
    }

    // Split text into multiple messages
    const pages = prepareLongText(text, textWrap, maxMessageLength);
    
    // Send message and add buttons
    if (!useReactions)
        await sendPagedTextWithButtons(channel, pages, embed);
    else
        await sendPagedTextWithReactions(channel, pages, embed);
}
