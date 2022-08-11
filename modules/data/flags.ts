import { Guild, GuildBasedChannel, Message, User } from "discord.js";
import { client, data } from "../../env";
import { FlagData } from "./models";

/**
 * Finds item in data by ID.
 * 
 * Supported items:
 * - Channel:
 *   - Channel ID only, for current guild;
 *   - Guild and channel ID, delimited by slash;
 * - Guild;
 * - User.
 */
export async function resolveFlaggableItem(msg: Message, id: string): Promise<{
    item: GuildBasedChannel | Guild | User;
    dataEntry: FlagData;
} | null> {
    // Channel (current guild)
    if (msg.inGuild()) {
        let channelData = data.guilds[msg.guildId].channels[id];
        if (channelData) {
            return {
                item: msg.guild.channels.resolve(id)!,
                dataEntry: channelData
            };
        }
    }

    // Channel (path specified)
    if (id.includes("/")) {
        let ids = id.split("/");

        let channelData = data.guilds[ids[0]]?.channels[ids[1]];
        if (channelData) {
            return {
                item: (await client.guilds.fetch(ids[0])).channels.resolve(ids[1])!,
                dataEntry: channelData
            };
        }
    }

    // Guild
    {
        let guild = data.guilds[id];
        if (guild) {
            return {
                item: await client.guilds.fetch(id),
                dataEntry: guild
            };
        }
    }

    // User
    {
        let user = data.users[id];
        if (user) {
            return {
                item: await client.users.fetch(id),
                dataEntry: user
            };
        }
    }

    return null;
}

export function toggleFlag(dataEntry: FlagData, flag: string) {
    if (!dataEntry.flags.includes(flag))
        dataEntry.flags.push(flag);
    else
        dataEntry.flags.splice(dataEntry.flags.indexOf(flag));
}

export function setFlag(dataEntry: FlagData, flag: string) {
    if (!dataEntry.flags.includes(flag))
        dataEntry.flags.push(flag);
}

export function removeFlag(dataEntry: FlagData, flag: string) {
    if (dataEntry.flags.includes(flag))
        dataEntry.flags.splice(dataEntry.flags.indexOf(flag));
}

export function hasFlag(dataEntry: FlagData, flag: string) {
    return dataEntry.flags.includes(flag);
}
