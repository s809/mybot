import { Channel, Guild, GuildBasedChannel, GuildMember, Role, Snowflake, TextChannel, User } from "discord.js";
import { data, defaultPrefix } from "../../env";

export function onChannelCreate(channel: GuildBasedChannel) {
    data.guilds[channel.guildId].channels[channel.id] = {
        ...{
            link: null,
            flags: [],
        },
        ...data.guilds[channel.guildId].channels[channel.id]
    };
}

export function onChannelRemove(channel: Channel | {
        id: Snowflake;
        guildId: Snowflake;
}) {
    if (!(channel instanceof TextChannel)) return;
    delete data.guilds[channel.guildId].channels[channel.id];
}

export function onRoleCreate(role: Role) {
    data.guilds[role.guild.id].roles[role.id] = {
        ...{
            allowedCommands: []
        },
        ...data.guilds[role.guild.id].roles[role.id]
    };
}

export function onRoleRemove(role: Role | {
        id: Snowflake;
        guild: {
            id: Snowflake;
        };
    }) {
    delete data.guilds[role.guild.id].roles[role.id];
}

export function createUser(user: User) {
    data.users[user.id] = {
        ...{
            allowedCommands: [],
            flags: [],
            language: "en"
        },
        ...data.users[user.id]
    };
}

export function onMemberCreate(member: GuildMember) {
    createUser(member.user);

    data.guilds[member.guild.id].members[member.id] = {
        ...{
            allowedCommands: []
        },
        ...data.guilds[member.guild.id].members[member.id]
    };
}

export function onMemberRemove(member: GuildMember | {
        id: Snowflake;
        guild: {
            id: Snowflake;
        };
    }) {
    delete data.guilds[member.guild.id].members[member.id];
}

export async function onGuildCreate(guild: Guild) {
    data.guilds[guild.id] = {
        ...{
            roles: {},
            members: {},
            channels: {},
            flags: [],
            prefix: defaultPrefix,
            language: "en"
        },
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
