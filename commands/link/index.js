"use strict";

import { mentionToChannel } from "../../util.js";
import { client } from "../../env.js";

import { isChannelLinked, linkChannel } from "../../modules/data/channelLinking.js";
import { GuildChannel, Message } from "discord.js";
import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import { importCommands } from "../../modules/commands/importHelper.js";

/**
 * @param {Message} msg
 * @param {string} idArg
 */
async function createLink(msg, idArg) {
    /** @type {GuildChannel} */
    let channel = client.channels.resolve(mentionToChannel(idArg));

    if (!msg.guildId)
        return "Cannot link to/from channels outside of an guild.";
    if (!msg.channel?.guildId)
        return "Unknown channel.";
    
    if (isChannelLinked(channel.guildId, channel.id))
        return "Cannot link to a linked channel.";
    if (isChannelLinked(msg.guildId, msg.channel.id))
        return "Channel is already linked.";

    await linkChannel(msg.channel, channel);

    if (msg.channel !== channel)
        await channel.send(`${msg.channel} is linked here.`);
}

export const name = "link";
export const description = "enable copying of messages in this channel to another.";
export const args = "<channel>";
export const minArgs = 1;
export const maxArgs = 1;
export const managementPermissionLevel = CommandManagementPermissionLevel.SERVER_OWNER;
export const func = createLink;
export const subcommands = await importCommands(import.meta.url);
