import { Guild, GuildChannel, Message, User } from "discord.js";
import { client, data } from "../../env.js";

/**
 * Finds item in data by ID.
 * 
 * Supported items:
 * - Channel:
 *   - Channel ID only, for current guild;
 *   - Guild and channel ID, delimited by slash;
 * - Guild;
 * - User.
 * 
 * @param {Message} msg
 * @param {string} id
 * @returns {Promise<{
 *  item: GuildChannel | Guild | User;
 *  dataEntry: {
 *   flags: string[];
 *  }
 * }>}
 */
export async function resolveItem(msg, id) {
    // Channel (current guild)
    if (msg.guild) {
        let channelData = data.guilds[msg.guildId].channels[id];
        if (channelData)
            return {
                item: msg.guild.channels.resolve(id),
                dataEntry: channelData
            };
    }

    // Channel (path specified)
    if (id.includes("/")) {
        let ids = id.split("/");

        let channelData = data.guilds[ids[0]]?.channels[ids[1]];
        if (channelData)
            return {
                item: client.guilds.resolve(ids[0]).channels.resolve(ids[1]),
                dataEntry: channelData
            };
    }

    // Guild
    {
        let guild = data.guilds[id];
        if (guild)
            return {
                item: client.guilds.resolve(id),
                dataEntry: guild
            };
    }

    // User
    {
        let user = data.users[id];
        if (user)
            return {
                item: await client.users.fetch(id),
                dataEntry: user
            };
    }

    return null;
}

export function toggleFlag(dataEntry, flag) {
    if (!dataEntry.flags.includes(flag))
        dataEntry.flags.push(flag);
    else
        dataEntry.flags.splice(dataEntry.flags.indexOf(flag));
}

export function setFlag(dataEntry, flag) {
    if (!dataEntry.flags.includes(flag))
        dataEntry.flags.push(flag);
}

export function removeFlag(dataEntry, flag) {
    if (dataEntry.flags.includes(flag))
        dataEntry.flags.splice(dataEntry.flags.indexOf(flag));
}

export function hasFlag(dataEntry, flag) {
    return dataEntry.flags.includes(flag);
}
