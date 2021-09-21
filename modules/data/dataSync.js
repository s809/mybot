import { Guild, GuildChannel, GuildMember, Role, User } from "discord.js";
import { data } from "../../env.js";
import { unlinkChannel } from "./channelLinking.js";

/**
 * @typedef {import("discord.js").Snowflake} Snowflake
 * @private
 */

/**
 * @param {GuildChannel} channel
 */
export function onChannelCreate(channel) {
    data.guilds[channel.guildId].channels[channel.id] = {
        link: null,
        flags: [],
        ...data.guilds[channel.guildId].channels[channel.id]
    };
}

/**
 * @param {GuildChannel | {
 *  id: Snowflake;
 *  guildId: Snowflake;
 * }} channel
 */
export function onChannelRemove(channel) {
    unlinkChannel(channel);
    delete data.guilds[channel.guildId].channels[channel.id];
}

/**
 * @param {Role} role
 */
export function onRoleCreate(role) {
    data.guilds[role.guild.id].roles[role.id] = {
        allowedCommands: [],
        ...data.guilds[role.guild.id].roles[role.id]
    };
}

/**
 * @param {Role | {
 *  id: Snowflake;
 *  guild: {
 *   id: Snowflake;
 *  }
 * }} role
 */
export function onRoleRemove(role) {
    delete data.guilds[role.guild.id].roles[role.id];
}

/**
 * @param {User} user
 */
export function createUser(user) {
    data.users[user.id] = {
        allowedCommands: [],
        flags: [],
        ...data.users[user.id]
    };
}

/**
 * @param {GuildMember} member
 */
export function onMemberCreate(member) {
    createUser(member.user);

    data.guilds[member.guild.id].members[member.id] = {
        allowedCommands: [],
        ...data.guilds[member.guild.id].members[member.id]
    };
}

/**
 * @param {GuildMember | {
 *  id: Snowflake;
 *  guild: {
 *   id: Snowflake;
 *  }
 * }} member
 */
export function onMemberRemove(member) {
    delete data.guilds[member.guild.id].members[member.id];
}

/**
 * @param {Guild} guild
 */
export async function onGuildCreate(guild) {
    data.guilds[guild.id] = {
        roles: {},
        members: {},
        channels: {},
        flags: [],
        ...data.guilds[guild.id]
    };
    let guildData = data.guilds[guild.id];

    // Add new channels
    for (let channel of guild.channels.cache.values())
        onChannelCreate(channel);
    
    // Remove missing channels
    for (let channelId of Object.getOwnPropertyNames(guildData.channels)) {
        if (!guild.channels.resolve(channelId))
            onChannelRemove({
                id: channelId,
                guildId: guild.id
            });
    }

    // Add new roles
    for (let role of guild.roles.cache.values())
        onRoleCreate(role);

    // Remove missing roles
    for (let roleId of Object.getOwnPropertyNames(guildData.roles)) {
        if (!guild.roles.resolve(roleId))
            onRoleRemove({
                id: roleId,
                guild: guild
            });
    }

    // Add new members
    for (let member of (await guild.members.fetch()).values())
        onMemberCreate(member);

    // Remove missing members
    for (let memberId of Object.getOwnPropertyNames(guildData.members)) {
        if (!guild.members.resolve(memberId)) {
            onMemberRemove({
                id: memberId,
                guild: guild
            });
        }
    }
}

/**
 * @param {Guild | {
 *  id: Snowflake
 * }} guild
 */
export function onGuildRemove(guild) {
    for (let channel of Object.getOwnPropertyNames(data.guilds[guild.id].channels))
        unlinkChannel({
            id: channel,
            guildId: guild.id
        });
}
