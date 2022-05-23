import { BaseGuildTextChannel, Message } from "discord.js";
import { client, data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { InviteTrackerData } from "../../modules/data/models";
import { tryInitTrackedGuild } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";
import { parseChannelMention } from "../../util";

async function enableInviteTracker(msg: Message, channelResolvable: string) {
    let translator = Translator.get(msg);

    let channel = client.channels.resolve(parseChannelMention(channelResolvable));
    if (!channel || !(channel instanceof BaseGuildTextChannel) || channel.guildId != msg.guildId)
        return translator.translate("errors.unknown_channel");

    let guildData = data.guilds[msg.guildId];
    guildData.inviteTracker = {
        ...guildData.inviteTracker,
        logChannelId: channel.id
    } as InviteTrackerData;

    if (!await tryInitTrackedGuild(msg.guild))
        return translator.translate("errors.tracker_init_failed");
}

const command: Command = {
    name: "enable",
    args: [1, 1, "<channel|id>"],
    func: enableInviteTracker
};
export default command;
