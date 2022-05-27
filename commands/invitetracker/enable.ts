import { Message, TextChannel } from "discord.js";
import { data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { tryInitTrackedGuild } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";
import { parseChannelMention } from "../../util";

async function enableInviteTracker(msg: Message, channelResolvable: string) {
    let translator = Translator.get(msg);

    let channel = msg.guild?.channels.resolve(parseChannelMention(channelResolvable));
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

const command: Command = {
    name: "enable",
    args: [1, 1, "<channel|id>"],
    func: enableInviteTracker
};
export default command;
