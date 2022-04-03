import { AnyChannel, Channel, Message, PartialTextBasedChannel, TextBasedChannel, TextChannel, User } from "discord.js";
import { client } from "../../env";
import iterateMessages from "../../modules/messages/iterateMessages";
import { parseChannelMention, parseMention } from "../../util";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage";
import sendLongText from "../../modules/messages/sendLongText";
import { once } from "events";
import { Translator } from "../../modules/misc/Translator";
import { Command } from "../../modules/commands/definitions";

async function scanChannel(msg: Message, mode: string, fromChannelStr: string) {
    let translator = Translator.get(msg);

    const inviteLink = /(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite)\/[^\s/]+?(?=\b)/g;
    const getWeekNumber = (d: Date) => {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        // Get first day of year
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        // Calculate full weeks to nearest Thursday and return
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    if (mode !== "daily" && mode !== "weekly" && mode !== "monthly")
        return translator.translate("errors.mode_not_defined");

    let fromChannel;
    if (fromChannelStr)
        fromChannel = await client.channels.fetch(parseChannelMention(fromChannelStr));
    else
        fromChannel = msg.channel;
    
    if (!(fromChannel instanceof TextChannel))
        return translator.translate("errors.non_text_channel");

    if (!(fromChannel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"])))
        return translator.translate("errors.cannot_read_channel");

    let authors: Map<string, User> = new Map();
    let userMessages: Map<string, {
        first: Message;
        last: Message;
        dailyCount: Map<string, number>;
    }> = new Map();
    let invites: Set<string> = new Set();

    let totalLength = 0;
    let counterMessage = await sendAlwaysLastMessage(msg.channel, {
        embeds: [{
            title: translator.translate("embeds.channel_scan.title"),
            description: translator.translate("embeds.channel_scan.progress.fetching_messages")
        }]
    });

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
        if (!(totalLength % 100)) {
            counterMessage = await counterMessage.edit({
                embeds: [{
                    title: translator.translate("embeds.channel_scan.title"),
                    description: translator.translate("embeds.channel_scan.progress.fetching_messages"),
                    footer: {
                        text: translator.translate("embeds.channel_scan.progress.fetch_progress", totalLength.toString())
                    }
                }]
            });
        }
    }

    await counterMessage.edit({
        embeds: [{
            title: translator.translate("embeds.channel_scan.title"),
            description: translator.translate("embeds.channel_scan.progress.fetching_invites"),
            footer: {
                text: translator.translate("embeds.channel_scan.progress.fetch_progress", totalLength.toString())
            }
        }]
    });
    if (counterMessage.editing)
        await once(counterMessage, "editComplete");

    {
        let result = "";
        let aliveInviteCount = 0;

        for (let invite of invites) {
            try {
                let arr = invite.split("/");

                let guildName = (await (client as any).api.invites(arr[arr.length - 1]).get()).guild.name;
                if (!invite.includes("://"))
                    invite = "https://" + invite;

                result += `${invite} (${guildName})\n`;
                aliveInviteCount++;
            }
            catch (e) { /* Skip */ }
        }
        result = translator.translate("embeds.channel_scan.finished.invites_summary", invites.size.toString(), aliveInviteCount.toString()) + result;
        await sendLongText(msg.channel, result, {
            code: null,
            multipleMessages: true,
            embed: {
                title: translator.translate("embeds.channel_scan.title")
            }
        });
    }

    await counterMessage.delete();

    {
        /** @type {import("discord.js").MessageEmbedOptions[]} */
        let embeds: import("discord.js").MessageEmbedOptions[] = [];
        /** @type {string[]} */
        let files: string[] = [];

        let sendAndClean = async () => {
            await msg.channel.send({
                embeds: embeds,
                files: files.map((x, i) => (x ? {
                    name: `statistics${i + 1}.txt`,
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
            let statTitle = translator.translate("embeds.channel_scan.finished.message_statistics");

            let unsanitizedResult = statTitle + "```\n" + result + "```";
            if (unsanitizedResult.length > 4096) {
                files.push(statTitle.replace(":", ` for ${authorStr}:`) + result);
                result = statTitle + translator.translate("embeds.channel_scan.finished.see_attachment", files.length.toString());
            }
            else {
                result = unsanitizedResult;
            }

            embeds.push({
                title: authorStr,
                description: result,
                fields: [
                    {
                        name: translator.translate("embeds.channel_scan.finished.first_message"),
                        value: `${data.first.url} (${data.first.createdAt.toLocaleString()})`
                    },
                    {
                        name: translator.translate("embeds.channel_scan.finished.last_message"),
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

const command: Command = {
    name: "scan",
    args: [1, 2, "<mode{daily,weekly,monthly}> [channel]"],
    func: scanChannel
};
export default command;
