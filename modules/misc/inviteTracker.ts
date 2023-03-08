import { Guild, GuildTextBasedChannel, Invite, Snowflake } from "discord.js";
import { Guild as DbGuild, InviteTrackerData } from "../../database/models";
import { commandFramework, runtimeGuildData } from "../../env";
import { Translator } from "@s809/noisecord";

export async function getInviteTrackerData(guild: Guild): Promise<[InviteTrackerData, GuildTextBasedChannel] | []> {
    const { inviteTracker } = await DbGuild.findByIdOrDefault(guild.id, { inviteTracker: 1 });
    if (!inviteTracker) return [];
    
    const channel = guild.channels.resolve(inviteTracker.logChannelId) as GuildTextBasedChannel;
    return channel
        ? [inviteTracker, channel]
        : [];
}

export async function trackInvites(channel: GuildTextBasedChannel) {
    await DbGuild.updateByIdWithUpsert(channel.guildId, {
        inviteTracker: {
            logChannelId: channel.id
        }
    });
    await startTracking(channel);
}

export async function untrackInvites(guildId: Snowflake) {
    delete runtimeGuildData.getOrSetDefault(guildId).inviteTracker;
    await DbGuild.updateOne({ _id: guildId }, {
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
    try {
        const { counts } = runtimeGuildData.getOrSetDefault(channel.guildId)
            .inviteTracker = {
                logChannel: channel,
                counts: (await channel.guild.invites.fetch())
                    .mapValues((invite: Invite) => invite.uses!)
            };

        await channel.send((await commandFramework.translatorManager!.getTranslator(channel.guild, "invitetracker")).translate("strings.tracking_started", { count: counts.size }));
    } catch { }
}
