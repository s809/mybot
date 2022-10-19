import { ApplicationCommandOptionType, GuildTextBasedChannel, PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../modules/commands/definitions";
import { iterateMessagesChunked } from "../modules/messages/iterateMessages";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { getRuntimeGuildData } from "../env";

async function deleteRange(msg: CommandMessage<true>, {
    startId,
    endId
}: {
    startId?: string;
    endId?: string;
}) {
    if (!(msg.channel as GuildTextBasedChannel).permissionsFor(msg.guild.members.me!).has(PermissionFlagsBits.ManageMessages))
        return "cannot_manage_messages";

    if (startId || endId) {
        try {
            if (!startId)
                return "invalid_message_range";
            if (!endId)
                endId = startId;
        
            if (BigInt(startId) < BigInt(endId))
                [startId, endId] = [endId, startId];
        } catch (e) {
            return "invalid_message_range";
        }
    } else {
        const runtimeData = getRuntimeGuildData(msg.guildId)
            .channels.getOrSet(msg.channelId, {
                members: new Map()
            })
            .members.getOrSet(msg.author.id, {});
        
        const range = runtimeData.messageSelectionRange;
        if (!range)
            return "nothing_is_selected";
        
        startId = range.begin;
        endId = range.end;
        delete runtimeData.messageSelectionRange;
    }

    try {
        for await (let chunk of iterateMessagesChunked(msg.channel, endId, startId)) {
            const bulkDeleted = await msg.channel.bulkDelete(chunk, true);
            
            for (let message of chunk.filter(message => !bulkDeleted.has(message.id)))
                await message.delete();
        }
    } catch (e) {
        return "delete_failed";
    }
}

const command: CommandDefinition = {
    key: "delrange",
    args: [{
        translationKey: "startId",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        translationKey: "endId",
        type: ApplicationCommandOptionType.String,
        required: false
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    allowDMs: false,
    usableAsAppCommand: true,
    handler: deleteRange
}
export default command;
