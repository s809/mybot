import { ApplicationCommandOptionType, GuildTextBasedChannel, PermissionFlagsBits } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition, textChannels } from "../../modules/commands/definitions";
import { trackInvites } from "../../modules/misc/inviteTracker";

async function enableInviteTracker(msg: CommandMessage<true>, {
    channel
}: {
    channel: GuildTextBasedChannel;
}) {
    if (!msg.guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild))
        return "need_manage_guild_permission";

    await trackInvites(channel);
}

const command: CommandDefinition = {
    key: "enable",
    args: [{
        translationKey: "channel",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: textChannels
    }],
    handler: enableInviteTracker,
    alwaysReactOnSuccess: true
};
export default command;
