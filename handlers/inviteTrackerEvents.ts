import { Message, CommandInteraction, CacheType, GuildResolvable } from "discord.js";
import { client, commandFramework, runtimeGuildData } from "../env";
import { untrackInvites, tryStartTracking } from "../modules/misc/inviteTracker";

function getTranslator(context: Message<boolean> | CommandInteraction<CacheType> | GuildResolvable) {
    return commandFramework.translatorManager.getTranslator(context, "invitetracker");
}

const strings = commandFramework.translationChecker.checkTranslations({
    invite_created: true,
    invite_deleted: true,
    member_joined: true,
    invite_used: true
}, "invitetracker.strings");

client.on("ready", async () => {
    for (let guild of client.guilds.cache.values())
        tryStartTracking(guild);
});

client.on("inviteCreate", async invite => {
    const { inviteTracker } = runtimeGuildData.get(invite.guild!.id);
    if (!inviteTracker) return;

    inviteTracker.counts.set(invite.code, invite.uses!);
    await inviteTracker.logChannel.send(await strings.invite_created.getTranslation(invite, {
        code: invite.code,
        user: invite.inviter?.tag ?? "Discord"
    }))
});

client.on("inviteDelete", async invite => {
    const { inviteTracker } = runtimeGuildData.get(invite.guild!.id);
    if (!inviteTracker) return;

    inviteTracker.counts.delete(invite.code);
    await inviteTracker.logChannel.send(await strings.invite_deleted.getTranslation(invite, { code: invite.code }))
});

client.on("guildMemberAdd", async member => {
    const { inviteTracker } = runtimeGuildData.get(member.guild.id);
    if (!inviteTracker) return;
    const { logChannel, counts } = inviteTracker;

    const translator = await getTranslator(member);
    try {
        await logChannel.send(strings.member_joined.getTranslation(translator, {
            user: member.user.tag
        }));
    
        for (let [code, invite] of await member.guild.invites.fetch()) {
            let entry = counts.get(code);

            if (entry !== undefined && entry !== invite.uses) {
                await logChannel.send(strings.invite_used.getTranslation(translator, {
                    code: invite.code,
                    user: invite.inviter!.tag
                }));
                counts.set(code, invite.uses!);
            }
        }
    } catch (e) {
        untrackInvites(member.guild.id);
    }
});
