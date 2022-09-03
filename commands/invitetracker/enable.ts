import { ApplicationCommandOptionType, GuildTextBasedChannel } from "discord.js";
import { data } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition, textChannels } from "../../modules/commands/definitions";
import { tryInitTrackedGuild } from "../../modules/misc/inviteTracker";

async function enableInviteTracker(msg: CommandMessage<true>, {
    channel
}: {
    channel: GuildTextBasedChannel;
}) {
    let guildData = data.guilds[msg.guildId];
    guildData.inviteTracker = {
        ...guildData.inviteTracker,
        logChannelId: channel.id
    };

    if (!await tryInitTrackedGuild(msg.guild))
        return "tracker_init_failed";
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
