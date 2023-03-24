import { CommandRequest, defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType, GuildChannel, PermissionFlagsBits } from "discord.js";
import { removeFlag, setFlag } from "../modules/data/flags";

async function toggleInviteChannel(req: CommandRequest<true>, {
    action
}: {
    action: "enable" | "disable"
}) {
    if (action === "enable") {
        await setFlag(req.channel as GuildChannel, "inviteChannel");
    } else {
        await removeFlag(req.channel as GuildChannel, "inviteChannel");
    }
}

export default defineCommand({
    key: "invitechannel",
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
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels | PermissionFlagsBits.CreateInstantInvite,
    allowDMs: false,
    handler: toggleInviteChannel
});
