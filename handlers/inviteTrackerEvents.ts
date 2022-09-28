import { Message, CommandInteraction, CacheType, GuildResolvable, Guild } from "discord.js";
import { client, storedInviteCounts } from "../env";
import { untrackInvites, getInviteTrackerData, tryStartTracking } from "../modules/misc/inviteTracker";
import { Translator } from "../modules/misc/Translator";

function getTranslator(context: Message<boolean> | CommandInteraction<CacheType> | GuildResolvable) {
    return Translator.getOrDefault(context, "invitetracker");
}

client.on("ready", async () => {
    for (let guild of client.guilds.cache.values())
        tryStartTracking(guild);
});

client.on("inviteCreate", async invite => {
    let [inviteTrackerData, channel] = await getInviteTrackerData(invite.guild as Guild);
    if (!inviteTrackerData) return;

    storedInviteCounts.get(invite.guild!.id)!.set(invite.code, invite.uses!);
    await channel!.send((await getTranslator(invite)).translate("strings.invite_created", invite.code, invite.inviter?.tag ?? "System"))
});

client.on("inviteDelete", async invite => {
    let [inviteTrackerData, channel] = await getInviteTrackerData(invite.guild as Guild);
    if (!inviteTrackerData) return;

    storedInviteCounts.get(invite.guild!.id)!.delete(invite.code);
    await channel!.send((await getTranslator(invite)).translate("strings.invite_deleted", invite.code))
});

client.on("guildMemberAdd", async member => {
    const [inviteTrackerData, channel] = await getInviteTrackerData(member.guild);
    if (!inviteTrackerData) return;

    const translator = await getTranslator(member);
    try {
        await channel!.send(translator.translate("strings.member_joined", member.user.tag));
    
        for (let [code, invite] of await member.guild.invites.fetch()) {
            let map = storedInviteCounts.get(member.guild.id)!;
            let entry = map.get(code);

            if (entry !== undefined && entry !== invite.uses) {
                await channel!.send(translator.translate("strings.invite_used", invite.code, invite.inviter!.tag));
                map.set(code, invite.uses!);
            }
        }
    } catch (e) {
        untrackInvites(member.guild.id);
    }
});
