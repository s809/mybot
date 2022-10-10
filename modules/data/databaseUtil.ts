import { ChannelResolvable, GuildMember, Role, Channel, GuildChannel, GuildBasedChannel } from "discord.js";
import { ChannelData, Guild, MemberData, RoleData } from "../../database/models";
import { DocumentOf } from "../../database/types";
import { guildChannelDefaults, guildMemberDefaults, guildRoleDefaults } from "../../database/defaults";
import { client } from "../../env";
import { transformString } from "../../util";

const transformationMap: [string, string][] = [
    ["\\", "\\bs"],
    ["[", "\\br"],
    [".", "\\dot"],
    ["$", "\\usd"]
];
const reverseTransformationMap = structuredClone(transformationMap)
    .reverse()
    .map(x => x.reverse() as [string, string]);

function getOrSet<T>(map: Map<string, T>, id: string, getDefaults: () => T) {
    return map.get(id) ?? (map.set(id, getDefaults()), map.get(id)!);
}

export async function getChannel(channel: ChannelResolvable, field?: string): Promise<[DocumentOf<typeof Guild>, ChannelData] | null> {
    const resolved = client.channels.resolve(channel) as GuildBasedChannel;
    if (!resolved?.guild) return null;

    const dbGuild = await Guild.findByIdOrDefault(resolved.guildId, { [`channels.${resolved.id}${field ? `.${field}` : ""}`]: 1 });
    return [dbGuild, getOrSet(dbGuild.channels, resolved.id, guildChannelDefaults)];
}

export async function getMember(member: GuildMember, field?: string): Promise<[DocumentOf<typeof Guild>, MemberData]> {
    const dbGuild = await Guild.findByIdOrDefault(member.guild.id, { [`members.${member.id}${field ? `.${field}` : ""}`]: 1 });
    return [dbGuild, getOrSet(dbGuild.members, member.id, guildMemberDefaults)];
}

export async function getRole(role: Role, field?: string): Promise<[DocumentOf<typeof Guild>, RoleData]> {
    const dbGuild = await Guild.findByIdOrDefault(role.guild.id, { [`roles.${role.id}${field ? `.${field}` : ""}`]: 1 });
    return [dbGuild, getOrSet(dbGuild.roles, role.id, guildRoleDefaults)];
}

export function escapeKey(key: string) {
    return transformString(key, transformationMap);
}

export function unescapeKey(key: string) {
    return transformString(key, reverseTransformationMap);
}
