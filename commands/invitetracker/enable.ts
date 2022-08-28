import { ApplicationCommandOptionType, GuildTextBasedChannel, Message, TextBasedChannel, TextChannel } from "discord.js";
import { data } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition, textChannels } from "../../modules/commands/definitions";
import { tryInitTrackedGuild } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";

async function enableInviteTracker(msg: CommandMessage<true>, {
    channel
}: {
    channel: GuildTextBasedChannel;
}) {
    let translator = Translator.getOrDefault(msg);

    let guildData = data.guilds[msg.guildId];
    guildData.inviteTracker = {
        ...guildData.inviteTracker,
        logChannelId: channel.id
    };

    if (!await tryInitTrackedGuild(msg.guild))
        return translator.translate("errors.tracker_init_failed");
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
