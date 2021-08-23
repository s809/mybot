import { Guild, GuildMember, Role, User } from "discord.js";
import { data } from "../env.js";

/**
 * @param {Guild} guild
 */
export async function onGuildCreate(guild) {
    data.guilds[guild.id] = {
        mappedChannels: {},
        roles: {},
        members: {},
        ...data.guilds[guild.id]
    };
    let guildData = data.guilds[guild.id];

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

    for (let member of (await guild.members.fetch()).values())
        onMemberCreate(member);

    // Remove missing members
    for (let memberId of Object.getOwnPropertyNames(guildData.members)) {
        if (!guild.members.resolve(memberId))
            onMemberRemove({
                id: memberId,
                guild: guild
            });
    }
}

/**
 * @param {Guild} guild
 */
export function onGuildRemove(guild) {
    delete data.guilds[guild.id];
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
 * @param {Role} role
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
        allowedCommands: []
    };
}

/**
 * @param {GuildMember} member
 */
export function onMemberRemove(member) {
    delete data.guilds[member.guild.id].members[member.id];
}
