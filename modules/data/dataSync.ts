import { BaseGuildTextChannel, Channel, Guild, GuildMember, Role, Snowflake } from "discord.js";
import { Guild as DbGuild } from "../../database/models";

// Do NOT add anything to database unless something is actually to be written
// to avoid spamming it with tons of empty structures.

export async function onChannelRemove(channel: Channel | {
    id: Snowflake;
    guildId: Snowflake;
}) {
    if (!(channel instanceof BaseGuildTextChannel)) return;

    const dbGuild = await DbGuild.findById(channel.guildId);
    if (dbGuild?.channels.delete(channel.id))
        await dbGuild.save();
}

export async function onRoleRemove(role: Role | {
    id: Snowflake;
    guild: {
        id: Snowflake;
    };
}) {
    const dbGuild = await DbGuild.findById(role.guild.id);
    if (dbGuild?.channels.delete(role.id))
        await dbGuild.save();
}

export async function onMemberRemove(member: GuildMember | {
    id: Snowflake;
    guild: {
        id: Snowflake;
    };
}) {
    const dbGuild = await DbGuild.findById(member.guild.id);
    if (dbGuild?.channels.delete(member.id))
        await dbGuild?.save();
}

export async function syncGuild(guild: Guild) {
    const dbGuild = await DbGuild.findById(guild.id);
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
