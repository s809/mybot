import { BaseGuildTextChannel, Channel, Guild, GuildMember, Role, Snowflake } from "discord.js";
import { Guild as DbGuild, TextGenData } from "../../database/models";

// Do NOT add anything to database unless something is actually to be written
// to avoid spamming it with tons of empty structures.

export async function onChannelRemove(channel: Channel | {
    id: Snowflake;
    guildId: Snowflake;
}) {
    if (!(channel instanceof BaseGuildTextChannel)) return;

    await DbGuild.updateOne({ _id: channel.guildId }, {
        $unset: {
            [`channels.${channel.id}`]: 1
        }
    });
    await TextGenData.deleteOne({ _id: channel.id });
}

export async function onRoleRemove(role: Role | {
    id: Snowflake;
    guild: {
        id: Snowflake;
    };
}) {
    await DbGuild.updateOne({ _id: role.guild.id }, {
        $unset: {
            [`roles.${role.id}`]: 1
        }
    });
}

export async function onMemberRemove(member: GuildMember | {
    id: Snowflake;
    guild: {
        id: Snowflake;
    };
}) {
    await DbGuild.updateOne({ _id: member.guild.id }, {
        $unset: {
            [`members.${member.id}`]: 1
        }
    });
}

export async function syncGuild(guild: Guild) {
    const dbGuild = await DbGuild.findById(guild.id, {
        channels: 1,
        roles: 1,
        members: 1
    });
    if (!dbGuild) return;

    // Remove missing channels
    for (const channelId of dbGuild.channels.keys()) {
        if (!guild.channels.resolve(channelId)) {
            onChannelRemove({
                id: channelId,
                guildId: guild.id
            });
        }
    }

    // Remove missing roles
    for (const roleId of dbGuild.roles.keys()) {
        if (!guild.roles.resolve(roleId)) {
            onRoleRemove({
                id: roleId,
                guild: guild
            });
        }
    }

    // Remove missing members
    for (const memberId of dbGuild.members.keys()) {
        if (!guild.members.resolve(memberId)) {
            onMemberRemove({
                id: memberId,
                guild: guild
            });
        }
    }

    await dbGuild.save();
}
