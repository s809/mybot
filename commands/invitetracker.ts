import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild } from "../database/models";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { CommandDefinition } from "../modules/commands/definitions";
import { trackInvites, untrackInvites } from "../modules/misc/inviteTracker";

async function manageInviteTracker(msg: CommandMessage<true>, {
    action
}: {
    action: "enable" | "disable"
}) {
    if (action === "enable") {
        if (!msg.guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite))
            return "missing_permissions";

        await trackInvites(msg.channel);
    } else {
        const guildData = (await Guild.findByIdOrDefault(msg.guildId, { inviteTracker: 1 }))!;
        if (!guildData.inviteTracker)
            return "already_disabled";

        untrackInvites(msg.guildId);
    }
}

const command: CommandDefinition = {
    key: "invitetracker",
    args: [{
        translationKey: "action",
        type: ApplicationCommandOptionType.String,
        choices: [{
            translationKey: "enable",
            value: "enable"
        }, {
            translationKey: "disable",
            value: "disable"
        }]
    }],
    handler: manageInviteTracker,
    alwaysReactOnSuccess: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite,
    allowDMs: false,
    usableAsAppCommand: true,
};
export default command;
