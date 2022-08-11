import { client, storedInviteCounts } from "../env";
import { cleanTrackedGuild, getInviteTrackerDataOrClean, tryInitTrackedGuild } from "../modules/misc/inviteTracker";
import { Translator } from "../modules/misc/Translator";

client.on("ready", async () => {
    for (let guild of client.guilds.cache.values())
        tryInitTrackedGuild(guild);
});

client.on("inviteCreate", async invite => {
    let [inviteTrackerData, channel] = getInviteTrackerDataOrClean(invite.guild!.id);
    if (!inviteTrackerData) return;

    storedInviteCounts.get(invite.guild!.id)!.set(invite.code, invite.uses!);
    await channel!.send(Translator.getOrDefault(invite).translate("embeds.invitetracker.invite_created", invite.code, invite.inviter!.tag))
        .catch(() => cleanTrackedGuild(invite.guild!.id));
});

client.on("inviteDelete", async invite => {
    let [inviteTrackerData, channel] = getInviteTrackerDataOrClean(invite.guild!.id);
    if (!inviteTrackerData) return;

    storedInviteCounts.get(invite.guild!.id)!.delete(invite.code);
    await channel!.send(Translator.getOrDefault(invite).translate("embeds.invitetracker.invite_deleted", invite.code))
        .catch(() => cleanTrackedGuild(invite.guild!.id));
});

client.on("guildMemberAdd", async member => {
    let [inviteTrackerData, channel] = getInviteTrackerDataOrClean(member.guild.id);
    if (!inviteTrackerData) return;

    let translator = Translator.getOrDefault(member);
    try {
        await channel!.send(translator.translate("embeds.invitetracker.member_joined", member.user.tag));
    
        for (let [code, invite] of await member.guild.invites.fetch()) {
            let map = storedInviteCounts.get(member.guild.id)!;
            let entry = map.get(code);

            if (entry !== undefined && entry !== invite.uses) {
                await channel!.send(translator.translate("embeds.invitetracker.invite_used", invite.code, invite.inviter!.tag));
                map.set(code, invite.uses!);
            }
        }
    } catch (e) {
        cleanTrackedGuild(member.guild.id);
    }
});
