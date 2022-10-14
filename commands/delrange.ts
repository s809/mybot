import { ApplicationCommandOptionType, GuildTextBasedChannel, PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../modules/commands/definitions";
import { iterateMessagesChunked } from "../modules/messages/iterateMessages";
import { CommandMessage } from "../modules/commands/CommandMessage";

async function deleteRange(msg: CommandMessage<true>, {
    startId,
    endId
}: {
    startId: string;
    endId: string;
}) {
    if (!(msg.channel as GuildTextBasedChannel).permissionsFor(msg.guild.members.me!).has(PermissionFlagsBits.ManageMessages))
        return "cannot_manage_messages";

    try {
        if (BigInt(startId) < BigInt(endId))
            [startId, endId] = [endId, startId];
    } catch (e) {
        return "invalid_message_range";
    }

    try {
        for await (let chunk of iterateMessagesChunked(msg.channel, startId, endId)) {
            const bulkDeleted = await (msg.channel as GuildTextBasedChannel).bulkDelete(chunk, true);
            
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
    }, {
        translationKey: "endId",
        type: ApplicationCommandOptionType.String,
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    allowDMs: false,
    usableAsAppCommand: true,
    handler: deleteRange
}
export default command;
