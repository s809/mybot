import { GuildChannel, ChannelResolvable, GuildMember, Role } from "discord.js";
import { ChannelData, Guild, MemberData, RoleData } from "../../database/models";
import { DocumentOf } from "../../database/types";
import { guildChannelDefaults, guildMemberDefaults, guildRoleDefaults } from "../../database/defaults";
import { client } from "../../env";

function getOrSet<T>(map: Map<string, T>, id: string, getDefaults: () => T) {
    return map.get(id) ?? (map.set(id, getDefaults()), map.get(id)!);
}

export async function getChannel(channel: ChannelResolvable): Promise<[DocumentOf<typeof Guild>, ChannelData] | null> {
    const resolved = client.channels.resolve(channel);
    if (!(resolved instanceof GuildChannel)) return null;

    const dbGuild = await Guild.findByIdOrDefault(resolved.guildId);
    return [dbGuild, getOrSet(dbGuild.channels, resolved.id, guildChannelDefaults)];
}

export async function getMember(member: GuildMember): Promise<[DocumentOf<typeof Guild>, MemberData]> {
    const dbGuild = await Guild.findByIdOrDefault(member.guild.id);
    return [dbGuild, getOrSet(dbGuild.members, member.id, guildMemberDefaults)];
}

export async function getRole(role: Role): Promise<[DocumentOf<typeof Guild>, RoleData]> {
    const dbGuild = await Guild.findByIdOrDefault(role.guild.id);
    return [dbGuild, getOrSet(dbGuild.roles, role.id, guildRoleDefaults)];
}
