"use strict";

import { client } from "../../env.js";
import iterateMessages from "../../modules/iterateMessages.js";
import { mentionToChannel } from "../../util.js";

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

    if (mode !== "daily" && mode !== "weekly" && mode !== "monthly") {
        await msg.channel.send("Mode is not defined!");
        return false;
    }

    if (fromChannel !== undefined)
        fromChannel = await client.channels.fetch(mentionToChannel(fromChannel));
    else
        fromChannel = msg.channel;

    if (!fromChannel.messages || !(fromChannel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]))) {
        await msg.channel.send("Channel is not a text channel or permissions are missing.");
        return;
    }

    let authors = new Map();
    let userMessages = new Map();
    let invites = new Set();

    let totalLength = 0;

    /** @type {Discord.Message} */
    let counter;
    /** @type {Error} */
    let counterError = null;
    /** @type {Promise<Discord.Message>} */
    let counterPromise = null;

    const markCounterUpdated = message => {
        counter = message;
        counterPromise = null;
        return message;
    };
    const markCounterError = e => {
        counterError = e;
    };

    counterPromise = msg.channel.send(`Fetching messages...`)
        .then(markCounterUpdated)
        .catch(markCounterError);

    for await (let message of iterateMessages(fromChannel, "0"))
    {
        if (counterError)
            throw counterError;
        if (!counterPromise)
        {
            counterPromise = counter.edit(`Fetching messages... (${totalLength} fetched)`)
                .then(markCounterUpdated)
                .catch(markCounterError);
        }

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
                last: "",
                dailyCount: new Map()
            });
        }
        let entry = userMessages.get(author);

        entry.last = message;

        if (!entry.dailyCount.get(date))
            entry.dailyCount.set(date, 0);
        entry.dailyCount.set(date, entry.dailyCount.get(date) + 1);
        
        // Gives counter a chance to update while a new block is being added to array.
        // Without this line it's updated only when new block is fetched.
        await new Promise(resolve => setImmediate(resolve));
        totalLength++;
    }

    // Wait and delete counter.
    if (counterPromise)
        await counterPromise;
    if (counterError)
        throw counterError;
    await counter.delete();

    let result = `Found ${invites.size} invites${invites.size ? ":\n" : "."}`;
    counter = 0;
    for (let invite of invites) {
        if (counter === 10) {
            await msg.channel.send(result);
            result = "";
            counter = 0;
        }
        result += invite + "\n";
        counter++;
    }
    msg.channel.send(result);
    result = "";

    for (let entry of userMessages.entries()) {
        entry[0] = authors.get(entry[0]);
        let data = entry[1];

        result += `\`${entry[0].tag} (${entry[0].id}):\`\n` +
            `  First message: ${data.first.url} (${data.first.createdAt.toLocaleString()})\n` +
            `  Last message: ${data.last.url} (${data.last.createdAt.toLocaleString()})\n` +
            `  ${mode[0].toUpperCase() + mode.substring(1)} message count:\n`;

        result += "```";
        for (let dayEntry of data.dailyCount.entries()) {
            result += `    ${dayEntry[0]}: ${dayEntry[1]}\n`;
        }
        result += "```\n";
    }

    let str = "";
    for (let line of result.split('\n')) {
        if (str.length + line.length > 2000 - 3) {
            let block = (str.match(/```/g) || []).length % 2 ? "```" : "";
            await msg.channel.send(str + block);
            str = block;
        }
        str += line + "\n";
    }
    if (str !== "")
        await msg.channel.send(str);

    return true;
}

export const name = "scan";
export const description = "get information about users sent to this or defined channel";
export const args = "<mode{daily,weekly,monthly}> [channel]";
export const minArgs = 1;
export const maxArgs = 2;
export const func = scanChannel;
