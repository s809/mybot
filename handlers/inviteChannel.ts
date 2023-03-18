import { Events } from "discord.js";
import { client, commandFramework } from "../env";
import { getChannel } from "../modules/data/databaseUtil";
import { Invite } from "discord.js";

const invitesPattern = new RegExp(Invite.InvitesPattern, "gi");

const strings = commandFramework.translationChecker.checkTranslations({
    expires_in: true
}, "invitechannel.strings");

client.on(Events.MessageCreate, async msg => {
    if (msg.author.bot || msg.webhookId) return;
    if (!msg.guild) return;

    const dbChannel = (await getChannel(msg.channel))!.data;
    if (dbChannel.flags.includes("inviteChannel")) {
        msg.delete().catch(() => { });

        const invites = msg.content.match(invitesPattern);
        if (!invites) return;

        try {
            for (const link of invites) {
                const invite = await client.fetchInvite(link.split("/").slice(-1)[0]).catch(() => { });
                // friend invites are unsupported
                if (!invite || !invite.guild) continue;

                await msg.channel.send(`${invite.guild!.name}\n` +
                    (invite.expiresTimestamp
                        ? await strings.expires_in.getTranslation(msg, { timestamp: `<t:${invite.expiresTimestamp / 1000}:R>` }) + "\n"
                        : "") +
                    `${invite}`);
            }
        } catch (e) { }
    }
});
