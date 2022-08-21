import { ApplicationCommandOptionType, Message, TextChannel } from "discord.js";
import { data } from "../../env";
import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition, textChannels } from "../../modules/commands/definitions";
import { tryInitTrackedGuild } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";
import { parseChannelMention } from "../../util";

async function enableInviteTracker(msg: CommandMessage<true>, channelResolvable: string) {
    let translator = Translator.getOrDefault(msg);

    const channelId = parseChannelMention(channelResolvable);
    if (!channelId)
        return translator.translate("errors.invalid_channel");
    let channel = msg.guild.channels.resolve(channelId);
    if (!(channel instanceof TextChannel))
        return translator.translate("errors.unknown_channel");

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
