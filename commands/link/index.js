import { mentionToChannel } from "../../util.js";
import { client } from "../../env.js";

import { isChannelLinked, linkChannel } from "../../modules/data/channelLinking.js";
import { GuildChannel, Message } from "discord.js";
import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import { importCommands } from "../../modules/commands/importHelper.js";
import { Translator } from "../../modules/misc/Translator.js";

/**
 * @param {Message} msg
 * @param {string} idArg
 */
async function createLink(msg, idArg) {
    let translator = Translator.get(msg);

    /** @type {GuildChannel} */
    let channel = client.channels.resolve(mentionToChannel(idArg));

    if (!msg.guildId)
        return translator.translate("errors.linking_outside_guild");
    if (!msg.channel?.guildId)
        return translator.translate("errors.unknown_channel");

    if (isChannelLinked(channel.guildId, channel.id))
        return translator.translate("errors.already_linked_destination");
    if (isChannelLinked(msg.guildId, msg.channel.id))
        return translator.translate("errors.already_linked_source");

    await linkChannel(msg.channel, channel);

    if (msg.channel !== channel)
        await channel.send(translator.translate("errors.channel_linked_here", msg.channel));
}

export const name = "link";
export const args = "<channel>";
export const minArgs = 1;
export const maxArgs = 1;
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
export const func = createLink;
export const subcommands = await importCommands(import.meta.url);
