import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild } from "../database/models";
import { CommandRequest } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { trackInvites, untrackInvites } from "../modules/misc/inviteTracker";

async function manageInviteTracker(msg: CommandRequest<true>, {
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
        key: "action",
        type: ApplicationCommandOptionType.String,
        choices: [{
            key: "enable",
            value: "enable"
        }, {
            key: "disable",
            value: "disable"
        }]
    }],
    handler: manageInviteTracker,
    alwaysReactOnSuccess: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite,
    allowDMs: false,
    interactionCommand: true,
};
export default command;
