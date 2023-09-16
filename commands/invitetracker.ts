import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild } from "../database/models";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { trackInvites, untrackInvites } from "../modules/misc/inviteTracker";

export default defineCommand({
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
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite,
    allowDMs: false,

    translations: {
        errors: {
            missing_permissions: true,
            already_disabled: true,
        }
    },

    handler: async (msg: CommandRequest<true>, { action }, { errors }) => {
        if (action === "enable") {
            if (!msg.guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite))
                return errors.missing_permissions;

            await trackInvites(msg.channel);
        } else {
            const guildData = (await Guild.findByIdOrDefault(msg.guildId, { inviteTracker: 1 }))!;
            if (!guildData.inviteTracker)
                return errors.already_disabled;

            untrackInvites(msg.guildId);
        }
    }
});
