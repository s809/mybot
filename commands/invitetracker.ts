import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild } from "../database/models";
import { CommandRequest } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { trackInvites, untrackInvites } from "../modules/misc/inviteTracker";
import { commandFramework } from "../env";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    missing_permissions: true,
    already_disabled: true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("invitetracker")}.errors`);

async function manageInviteTracker(msg: CommandRequest<true>, {
    action
}: {
    action: "enable" | "disable"
}) {
    if (action === "enable") {
        if (!msg.guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite))
            return errorLoc.missing_permissions.path;

        await trackInvites(msg.channel);
    } else {
        const guildData = (await Guild.findByIdOrDefault(msg.guildId, { inviteTracker: 1 }))!;
        if (!guildData.inviteTracker)
            return errorLoc.already_disabled.path;

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
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite,
    allowDMs: false,
};
export default command;
