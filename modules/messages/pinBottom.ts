import { GuildTextBasedChannel } from "discord.js";
import { ChannelData, Guild } from "../../database/models";
import { client, runtimeGuildData } from "../../env";
import { getChannel } from "../data/databaseUtil";
import { sendAlwaysLastMessage, wrapAlwaysLastMessage } from "./AlwaysLastMessage";

export async function pinMessage(channel: GuildTextBasedChannel, messageInterval?: number, content?: string) {
    const path = `channels.${channel.id}.pinnedMessage`;
    
    if (!content) {
        let { pinnedMessage } = (await getChannel(channel, "pinnedMessage"))!.data;
        if (!pinnedMessage)
            return false;
        
        if (messageInterval) {
            pinnedMessage = (await Guild.findByIdAndUpdate({
                _id: channel.guildId
            }, {
                $set: {
                    [`${path}.interval`]: messageInterval
                }
            }, {
                new: true,
                fields: {
                    [path]: 1
                }
            }))!.channels.get(channel.id)!.pinnedMessage!;
        }

        doPinMessage(channel, pinnedMessage);
    } else {
        const pinnedMessage = await Guild.findByIdAndUpdate(channel.guildId, [{
            $set: {
                [path]: {
                    content,
                    interval: messageInterval,
                    lastMessage: { $ifNull: [`$${path}.lastMessage`, "0"] }
                }
            }
        }], {
            upsert: true,
            new: true
        });

        doPinMessage(channel, pinnedMessage!.channels.get(channel.id)!.pinnedMessage!)
    }

    return true;
}

export async function doPinMessage(channel: GuildTextBasedChannel, {
    content,
    interval: messageInterval,
    lastMessage
}: NonNullable<ChannelData["pinnedMessage"]>) {
    const channelData = runtimeGuildData.get(channel.guildId!)
        .channels.get(channel.id);

    if (channelData.pinnedMessageUpdater)
        client.off("messageCreate", channelData.pinnedMessageUpdater);
    
    const fetched = await channel.messages.fetch(lastMessage).catch(() => { });
    const pinnedMessage = fetched
        ? wrapAlwaysLastMessage(fetched)
        : await sendAlwaysLastMessage(channel, content);
    
    const messagesAfter = await channel.messages.fetch({
        after: pinnedMessage.id,
        limit: messageInterval
    });

    let counter = pinnedMessage.content === content
        ? messagesAfter.size
        : messageInterval;

    const update = async () => {
        if (counter === messageInterval) {
            counter = 0;
            await pinnedMessage.edit(content);
        }

        await Guild.updateOne({
            _id: channel.guildId
        }, {
            $set: {
                [`channels.${channel.id}.pinnedMessage.lastMessage`]: pinnedMessage.id
            }
        });
    }

    update();
    client.on("messageCreate", channelData.pinnedMessageUpdater = async msg => {
        if (msg.channelId !== channel.id) return;
        if (msg.author.id === client.user!.id) return;

        if (++counter === messageInterval)
            update();
    });
}

export async function unpinMessage(channel: GuildTextBasedChannel) {
    const channelData = runtimeGuildData.get(channel.guildId!)
        .channels.get(channel.id);
    
    if (channelData.pinnedMessageUpdater) {
        client.off("messageCreate", channelData.pinnedMessageUpdater);
        delete channelData.pinnedMessageUpdater;
    } else {
        return false;
    }

    await Guild.updateOne({
        _id: channel.guildId
    }, {
        $unset: {
            [`channels.${channel.id}.pinnedMessage`]: 1
        }
    });

    return true;
}
