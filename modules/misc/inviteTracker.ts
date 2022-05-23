import { Guild, GuildTextBasedChannel, Snowflake } from "discord.js";
import { data, client, storedInviteCounts } from "../../env";
import { InviteTrackerData } from "../data/models";
import { Translator } from "./Translator";

export function getInviteTrackerDataOrClean(guildId: Snowflake): [InviteTrackerData, GuildTextBasedChannel] | [null, null] {
    let inviteTrackerData = data.guilds[guildId]?.inviteTracker as InviteTrackerData;
    if (!inviteTrackerData)
        return [null, null];

    let channel = client.channels.resolve(inviteTrackerData.logChannelId) as GuildTextBasedChannel;
    if (!channel) {
        cleanTrackedGuild(guildId);
        return [null, null];
    }

    return [inviteTrackerData, channel];
}

export async function tryInitTrackedGuild(guild: Guild) {
    let [inviteTrackerData, channel] = getInviteTrackerDataOrClean(guild.id);
    if (!inviteTrackerData) return;

    let map = new Map();
    storedInviteCounts.set(guild.id, map);

    try {
        for (let [code, invite] of await guild.invites.fetch())
            map.set(code, invite.uses);

        await channel.send(Translator.get(guild).translate("embeds.invitetracker.tracking_started", map.size.toString()));
        return true;
    }
    catch (e) {
        cleanTrackedGuild(guild.id);
        return false;
    }
}

export function cleanTrackedGuild(guildId: Snowflake) {
    storedInviteCounts.delete(guildId);
    delete data.guilds[guildId].inviteTracker;
}
