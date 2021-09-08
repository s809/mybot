/**
 * @file Provides utility functions for sending messages.
 */
"use strict";

import MessageWithButtons, { MessageButtonType } from "./MessageWithButtons.js";

const title = "Page %page% of %pagecount%";
const separator = ":\n";
const contentWrap = "```%code%\n%content% ```";

const maxMessageLength = 4096;
const splitMinCharacters = 256;
const back = "◀", stop = "✖", forward = "▶";

/**
 * Prepare pages for sending.
 * DOES consider page header.
 * 
 * @param {string} text Text to prepare.
 * @param {string} textWrap Text for wrapping pages.
 * Must contain `%content%` and optionally `%page%` and `%pagecount%`.
 * @returns {string[]} Array of prepared pages of text.
 */
function splitTextByCharacters(text, textWrap) {
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
 * Prepare pages for sending.
 * DOES NOT consider page header.
 *
 * @param {string} text Text to prepare.
 * @param {string} textWrap Text for wrapping pages.
 * Must contain `%content%`.
 * @param {string} delimiter Delimiter for splitting text.
 * @returns {string[]} Array of prepared pages of text.
 * @throws Delimiter must be 1 character long.
 */
function splitTextByDelimiter(text, textWrap, delimiter) {
    if (delimiter.length > 1)
        throw new Error("Cannot split by delimiter longer than 1 character");

    const maxMessageLengthWithWrap = maxMessageLength - (textWrap.length - "%content%".length);
    
    let result = [""];

    for (let chunk of text.split(delimiter)) {
        let lastPageLength = result[result.length - 1].length;

        if (lastPageLength + 1 + chunk.length > maxMessageLengthWithWrap) {
            if (lastPageLength < maxMessageLengthWithWrap - splitMinCharacters) {
                for (let pos = 0; pos < chunk.length;) {
                    let content = chunk.slice(pos, pos + maxMessageLengthWithWrap - lastPageLength - (lastPageLength !== 0));

                    // Remove trailing escape character
                    if (content.match(/(?<!\\)\\(\\\\)*$/))
                        content = content.slice(0, -1);

                    pos += content.length;
                    result[result.length - 1] += lastPageLength !== 0
                        ? delimiter + content
                        : content;

                    result.push("");
                    lastPageLength = 0;
                }
            }
            else {
                result.push(chunk);
            }
        }
        else {
            result[result.length - 1] += lastPageLength > 0
                ? delimiter + chunk
                : chunk;
        }
    }

    if (result[result.length - 1].length === 0)
        result.pop();
    
    for (let page = 0; page < result.length; page++)
        result[page] = textWrap.replace("%content%", result[page]);

    return result;
}

/**
 * Send message with buttons for page switching.
 * 
 * @param {import("discord.js").TextBasedChannels} channel Channel in which to send a message.
 * @param {string[]} pages Array of page texts.
 * @param {MessageButtonType} buttonType Type of buttons to use.
 * @param {import("discord.js").MessageEmbedOptions} embed Embed template for wrapping text.
 * Title and desctiption will be overwritten.
 */
async function sendPagedTextWithButtons(channel, pages, buttonType, embed = {}) {
    let backButton = {
        customId: "back_button",
        style: "PRIMARY",
        emoji: back,
        disabled: true
    };

    let stopButton = {
        customId: "stop_button",
        style: "DANGER",
        emoji: stop
    };

    let forwardButton = {
        customId: "forward_button",
        style: "PRIMARY",
        emoji: forward
    };

    let msg = new MessageWithButtons(buttonType,
        backButton,
        stopButton,
        forwardButton
    );

    let page = 0;

    const getOptions = () => ({
        embeds: embed !== null ? [{
            ...embed,
            title: title.replace("%page%", page + 1).replace("%pagecount%", pages.length),
            description: pages[page],
        }] : undefined,
        content: embed === null ? pages[page] : undefined
    });

    await msg.send(channel, getOptions(), async customId => {
        switch (customId) {
            case backButton.customId:
                page = Math.max(page - 1, 0);
                break;
            case stopButton.customId:
                msg.stopCollectingInteractions();
                return;
            case forwardButton.customId:
                page = Math.min(page + 1, pages.length - 1);
                break;
        }

        msg.setButtonDisabled(back, page === 0);
        msg.setButtonDisabled(forward, page === pages.length - 1);

        await msg.edit(getOptions());
    });
}

/**
 * Sends text, splitting and adding page buttons if necessary.
 * 
 * @param {import("discord.js").TextBasedChannels} channel Channel to send a message.
 * @param {string} text Text to send.
 * @param {object} options Additional options.
 * @param {string?} options.code Type of optional code block.
 * @param {import("discord.js").MessageEmbedOptions?} options.embed Template of embed for message.
 * @param {boolean} options.useReactions Whether to use reactions instead of embed buttons.
 * @param {string?} options.delimiter Delimiter for splitting text in pages.
 * If not specified, text will be split by characters.
 */
export default async function sendLongText(channel, text, {
    code = "js",
    embed = {},
    useReactions = false,
    delimiter = "\n"
} = {}) {
    text = text.replaceAll("```", "\\`\\`\\`");

    const contentWrapWithCode = contentWrap.replace("%code%", code);
    let textWrap = code !== null ? contentWrapWithCode : "%content%";

    if (embed === null) {
        if (delimiter !== null)
            throw new Error("Cannot give accurate enough page count when splitting by delimiter outside embed");
        
        textWrap = title + separator + textWrap;
    }

    // Text fits in one message
    if (text.length < maxMessageLength - (contentWrapWithCode.length - "%content%".length)) {
        await channel.send(embed ? {
            embeds: [{
                ...embed,
                ...{
                    description: textWrap.replace("%content%", text),
                },
            }]
        } : textWrap.replace("%content%", text));
        return;
    }

    // Split text into multiple messages
    let pages;
    if (delimiter)
        pages = splitTextByDelimiter(text, textWrap, delimiter);
    else
        pages = splitTextByCharacters(text, textWrap, maxMessageLength);

    // Send message and add buttons
    await sendPagedTextWithButtons(channel, pages, useReactions ? MessageButtonType.REACTION : MessageButtonType.BUTTON, embed);
}
