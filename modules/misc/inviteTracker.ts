import { Guild, GuildTextBasedChannel, Snowflake } from "discord.js";
import { storedInviteCounts } from "../../env";
import { Guild as DbGuild, InviteTrackerData } from "../../database/models";
import { Translator } from "./Translator";

export async function getInviteTrackerData(guild: Guild): Promise<[InviteTrackerData, GuildTextBasedChannel] | []> {
    const { inviteTracker } = await DbGuild.findByIdOrDefault(guild.id);
    if (!inviteTracker) return [];
    
    const channel = guild.channels.resolve(inviteTracker.logChannelId) as GuildTextBasedChannel;
    return channel
        ? [inviteTracker, channel]
        : [];
}

export async function trackInvites(channel: GuildTextBasedChannel) {
    await DbGuild.findByIdOrDefaultAndUpdate(channel.guildId, {
        inviteTracker: {
            logChannelId: channel.id
        }
    });
    await startTracking(channel);
}

export async function untrackInvites(guildId: Snowflake) {
    storedInviteCounts.delete(guildId);
    await DbGuild.findByIdOrDefaultAndUpdate(guildId, {
        $unset: {
            inviteTracker: 1
        }
    });
}

export async function tryStartTracking(guild: Guild) {
    const channel = (await getInviteTrackerData(guild))[1];
    if (!channel) return false;

    startTracking(channel);
    return true;
}

export async function startTracking(channel: GuildTextBasedChannel) {
    const map = new Map();
    storedInviteCounts.set(channel.guildId, map);

    try {
        for (const [code, invite] of await channel.guild.invites.fetch())
            map.set(code, invite.uses);

        await channel.send((await Translator.getOrDefault(channel.guild, "invitetracker")).translate("strings.tracking_started", map.size.toString()));
    } catch { }
}
