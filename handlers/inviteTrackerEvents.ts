import { Message, CommandInteraction, CacheType, GuildResolvable } from "discord.js";
import { client, commandFramework, runtimeGuildData } from "../env";
import { untrackInvites, tryStartTracking } from "../modules/misc/inviteTracker";

function getTranslator(context: Message<boolean> | CommandInteraction<CacheType> | GuildResolvable) {
    return commandFramework.translatorManager!.getTranslator(context, "invitetracker");
}

client.on("ready", async () => {
    for (let guild of client.guilds.cache.values())
        tryStartTracking(guild);
});

client.on("inviteCreate", async invite => {
    const { inviteTracker } = runtimeGuildData.getOrSetDefault(invite.guild!.id);
    if (!inviteTracker) return;

    inviteTracker.counts.set(invite.code, invite.uses!);
    await inviteTracker.logChannel.send((await getTranslator(invite)).translate("strings.invite_created", {
        code: invite.code,
        user: invite.inviter?.tag ?? "Discord"
    }))
});

client.on("inviteDelete", async invite => {
    const { inviteTracker } = runtimeGuildData.getOrSetDefault(invite.guild!.id);
    if (!inviteTracker) return;

    inviteTracker.counts.delete(invite.code);
    await inviteTracker.logChannel.send((await getTranslator(invite)).translate("strings.invite_deleted", { code: invite.code }))
});

client.on("guildMemberAdd", async member => {
    const { inviteTracker } = runtimeGuildData.getOrSetDefault(member.guild.id);
    if (!inviteTracker) return;
    const { logChannel, counts } = inviteTracker;

    const translator = await getTranslator(member);
    try {
        await logChannel.send(translator.translate("strings.member_joined", {
            user: member.user.tag
        }));
    
        for (let [code, invite] of await member.guild.invites.fetch()) {
            let entry = counts.get(code);

            if (entry !== undefined && entry !== invite.uses) {
                await logChannel.send(translator.translate("strings.invite_used", {
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
