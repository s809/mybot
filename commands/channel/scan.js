"use strict";

import { Message, TextChannel, User } from "discord.js";
import { client } from "../../env.js";
import iterateMessages from "../../modules/messages/iterateMessages.js";
import { awaitEvent, mentionToChannel } from "../../util.js";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage.js";
import sendLongText from "../../modules/messages/sendLongText.js";

/**
 * @param {Message} msg 
 * @param {string} mode 
 * @param {string} fromChannel 
 * @returns {boolean}
 */
async function scanChannel(msg, mode, fromChannel) {
    const inviteLink = /(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite)\/[^\s/]+?(?=\b)/g;
    const getWeekNumber = d => {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        // Get first day of year
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        // Calculate full weeks to nearest Thursday and return
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    if (mode !== "daily" && mode !== "weekly" && mode !== "monthly")
        return "Mode is not defined.";

    if (fromChannel !== undefined)
        fromChannel = await client.channels.fetch(mentionToChannel(fromChannel));
    else
        fromChannel = msg.channel;

    if (!(fromChannel instanceof TextChannel) || !(fromChannel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"])))
        return "Channel is not a text channel or permissions are missing.";

    /** @type {Map<string, User>} */
    let authors = new Map();
    /**
     * @type {Map<string, {
     *  first: Message,
     *  last: Message,
     *  dailyCount: Map<string, number>
     * }>}
     */
    let userMessages = new Map();
    /** @type {Set<string>} */
    let invites = new Set();

    let totalLength = 0;
    let counterMessage = await sendAlwaysLastMessage(msg.channel, `Fetching messages...`);

    for await (let message of iterateMessages(fromChannel, "0")) {
        if (!authors.has(message.author.tag))
            authors.set(message.author.tag, message.author);
        let author = message.author.tag;

        let date;
        if (mode === "weekly") {
            date = getWeekNumber(message.createdAt).toString().padStart(2, "0") + "." + message.createdAt.getUTCFullYear();
        }
        else {
            date = (mode === "daily" ? message.createdAt.getUTCDate().toString().padStart(2, "0") + "." : "") +
                (message.createdAt.getUTCMonth() + 1).toString().padStart(2, "0") + "." +
                message.createdAt.getUTCFullYear();
        }

        Array.from(message.content.matchAll(inviteLink), x => x[0]).forEach(x => invites.add(x));

        if (!userMessages.has(author)) {
            userMessages.set(author, {
                first: message,
                last: undefined,
                dailyCount: new Map()
            });
        }

        let entry = userMessages.get(author);
        entry.last = message;

        if (!entry.dailyCount.get(date))
            entry.dailyCount.set(date, 0);
        entry.dailyCount.set(date, entry.dailyCount.get(date) + 1);
        totalLength++;
        if (!(totalLength % 100))
            counterMessage = await counterMessage.edit(`Fetching messages... (${totalLength} fetched)`);
    }

    await counterMessage.edit(`Fetched ${totalLength} messages.\n` +
        "Fetching invites...");
    if (counterMessage.editing)
        await awaitEvent(counterMessage, "editComplete");

    {
        let result = "";
        let aliveInviteCount = 0;

        for (let invite of invites) {
            try {
                let arr = invite.split("/");

                let guildName = (await client.api.invites(arr[arr.length - 1]).get()).guild.name;
                if (!invite.includes("://"))
                    invite = "https://" + invite;
                
                result += `${invite} (${guildName})\n`;
                aliveInviteCount++;
            }
            catch (e) { /* Skip */ }
        }
        result = `Found ${invites.size} invites, alive: ${aliveInviteCount}\n` + result;
        await sendLongText(msg.channel, result, { code: null });
    }

    await counterMessage.delete();

    {
        /** @type {import("discord.js").MessageEmbedOptions[]} */
        let embeds = [];
        /** @type {string[]} */
        let files = [];

        let sendAndClean = async () => {
            await msg.channel.send({
                embeds: embeds,
                files: files.map((x, i) => (x ? {
                    name: `${i + 1}.txt`,
                    attachment: Buffer.from(x, "utf8")
                } : null)).filter(x => x)
            });
            embeds = [];
            files = [];
        };

        for (let entry of userMessages.entries()) {
            let author = authors.get(entry[0]);
            let data = entry[1];

            let result = "";
            for (let dayEntry of data.dailyCount.entries())
                result += `${dayEntry[0]}: ${dayEntry[1]}\n`;

            let authorStr = `${author.tag} (${author.id})`;
            let capitalizedMode = mode[0].toUpperCase() + mode.substring(1);
            let statTitle = `${capitalizedMode} message statistics:\n`;

            let unsanitizedResult = statTitle + "```\n" + result + "```";
            if (unsanitizedResult.length > 4096) {
                files.push(statTitle.replace(":", ` for ${authorStr}:`) + result);
                result = statTitle + `*See attachment (${files.length})*`;
            }
            else {
                result = unsanitizedResult;
            }

            embeds.push({
                title: authorStr,
                description: result,
                fields: [
                    {
                        name: "First message",
                        value: `${data.first.url} (${data.first.createdAt.toLocaleString()})`
                    },
                    {
                        name: "Last message",
                        value: `${data.last.url} (${data.last.createdAt.toLocaleString()})`
                    },
                ]
            });

            if (embeds.length === 10)
                await sendAndClean();
        }
        if (embeds.length)
            await sendAndClean();
    }
}

export const name = "scan";
export const description = "get information about users sent to this or defined channel";
export const args = "<mode{daily,weekly,monthly}> [channel]";
export const minArgs = 1;
export const maxArgs = 2;
export const func = scanChannel;
