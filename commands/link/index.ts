import { parseChannelMention } from "../../util";
import { client } from "../../env";

import { isChannelLinked, linkChannel } from "../../modules/data/channelLinking";
import { BaseGuildTextChannel, Message } from "discord.js";
import { importCommands } from "../../modules/commands/importHelper";
import { Translator } from "../../modules/misc/Translator";
import { Command } from "../../modules/commands/definitions";

async function createLink(msg: Message, idArg: string) {
    let translator = Translator.get(msg);

    let channel = client.channels.resolve(parseChannelMention(idArg));

    if (!(msg.channel instanceof BaseGuildTextChannel) || !(channel instanceof BaseGuildTextChannel))
        return translator.translate("errors.linking_outside_guild")
    if (!channel)
        return translator.translate("errors.unknown_channel");

    if (isChannelLinked(channel.guildId, channel.id))
        return translator.translate("errors.already_linked_destination");
    if (isChannelLinked(msg.guildId, msg.channel.id))
        return translator.translate("errors.already_linked_source");

    await linkChannel(msg.channel, channel);

    if (msg.channel !== channel)
        await channel.send(translator.translate("errors.channel_linked_here", msg.channel.toString()));
}

const command: Command = {
    name: "link",
    args: [1, 1, "<channel>"],
    managementPermissionLevel: "BOT_OWNER",
    func: createLink,
    subcommands: await importCommands(import.meta.url)
};
export default command;
