import { InteractionCommandRequest, Translatable, defineCommand, textChannels as guildTextChannels } from "@s809/noisecord";
import { APIEmbed, ApplicationCommandOptionType, EmbedBuilder, Message, User } from "discord.js";
import { once } from "events";
import { client } from "../../env";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage";
import { iterateMessages } from "../../modules/messages/iterateMessages";
import sendLongText from "../../modules/messages/sendLongText";

const inviteLink = /(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite)\/[^\s/]+?(?=\b)/g;
function getWeekNumber(d: Date) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday and return
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default defineCommand({
    key: "scan",
    args: [{
        key: "mode",
        type: ApplicationCommandOptionType.String,
        choices: [{
            key: "daily",
            value: "daily"
        }, {
            key: "weekly",
            value: "weekly"
        }, {
            key: "monthly",
            value: "monthly"
        }]
    }, {
        key: "channel",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: guildTextChannels
    }],
    ownerOnly: true,
    allowDMs: false,

    translations: {
        embeds: {
            title: true,
            progress: {
                fetching_messages: true,
                fetch_progress: true,
                fetching_invites: true,
            },
            finished: {
                invites_summary: true,
                message_statistics: true,
                see_attachment: true,
                first_message: true,
                last_message: true,
            }
        }
    },

    handler: async (req, { mode, channel }, { embeds: embedLoc }) => {
        let fromChannel = channel ?? req.channel;

        let authors: Map<string, User> = new Map();
        let userMessages: Map<string, {
            first: Message;
            last: Message;
            dailyCount: Map<string, number>;
        }> = new Map();
        let invites: Set<string> = new Set();

        let totalLength = 0;

        if (req instanceof InteractionCommandRequest)
            await req.response.delete();

        let counterMessage = await sendAlwaysLastMessage(req.channel, {
            embeds: [{
                title: embedLoc.title,
                description: embedLoc.progress.fetching_messages
            }],
            content: embedLoc.title
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

            let entry = userMessages.get(author);
            if (!entry) {
                entry = {
                    first: message,
                    last: message,
                    dailyCount: new Map()
                };
                userMessages.set(author, entry);
            }
            entry.last = message;

            entry.dailyCount.set(date, (entry.dailyCount.get(date) ?? 0) + 1);

            totalLength++;
            if (!(totalLength % 100)) {
                counterMessage = await counterMessage.edit({
                    embeds: [{
                        title: embedLoc.title,
                        description: embedLoc.progress.fetching_messages,
                        footer: {
                            text: embedLoc.progress.fetch_progress.withArgs({ count: totalLength })
                        }
                    }]
                });
            }
        }

        await counterMessage.edit({
            embeds: [{
                title: embedLoc.title,
                description: embedLoc.progress.fetching_invites,
                footer: {
                    text: embedLoc.progress.fetch_progress.withArgs({ count: totalLength })
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
                    let guildName = (await client.fetchInvite(invite)).guild?.name;
                    result += `${invite} (${guildName})\n`;
                    aliveInviteCount++;
                }
                catch (e) { /* Skip */ }
            }
            result = embedLoc.finished.invites_summary.withArgs({
                invites: invites.size,
                aliveInvites: aliveInviteCount
            }).translate() + "\n" + result;
            await sendLongText(req.channel, result, {
                code: null,
                multipleMessages: true,
                embed: new EmbedBuilder({
                    title: embedLoc.title.translate()
                })
            });
        }

        await counterMessage.delete();

        {
            let embeds: APIEmbed[] = [];
            let files: string[] = [];

            let sendAndClean = async () => {
                await req.channel.send({
                    embeds: embeds,
                    files: files.filter(x => x).map((x, i) => ({
                        name: `statistics${i + 1}.txt`,
                        attachment: Buffer.from(x, "utf8")
                    }))
                });
                embeds = [];
                files = [];
            };

            for (let entry of userMessages.entries()) {
                let author = authors.get(entry[0])!;
                let data = entry[1];

                let result = "";
                for (let dayEntry of data.dailyCount.entries())
                    result += `${dayEntry[0]}: ${dayEntry[1]}\n`;

                let authorStr = `${author.tag} (${author.id})`;
                let statTitle = embedLoc.finished.message_statistics.translate();

                let unsanitizedResult = statTitle + "\n```\n" + result + "```";
                if (unsanitizedResult.length > 4096) {
                    files.push(statTitle.replace(":", ` for ${authorStr}:`) + result);
                    result = statTitle + embedLoc.finished.see_attachment.withArgs({ name: files.length });
                }
                else {
                    result = unsanitizedResult;
                }

                embeds.push(Translatable.translateValue<APIEmbed>({
                    title: authorStr,
                    description: result,
                    fields: [
                        {
                            name: embedLoc.finished.first_message,
                            value: `${data.first.url} (${data.first.createdAt.toLocaleString()})`
                        },
                        {
                            name: embedLoc.finished.last_message,
                            value: `${data.last.url} (${data.last.createdAt.toLocaleString()})`
                        },
                    ]
                }));

                if (embeds.length === 10)
                    await sendAndClean();
            }
            if (embeds.length)
                await sendAndClean();
        }
    },
});
