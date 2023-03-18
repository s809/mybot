import { ApplicationCommandOptionType, GuildTextBasedChannel, PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "@s809/noisecord";
import { iterateMessagesChunked } from "../modules/messages/iterateMessages";
import { CommandRequest } from "@s809/noisecord";
import { commandFramework, runtimeGuildData } from "../env";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    cannot_manage_messages: true,
    invalid_message_range: true,
    nothing_is_selected: true,
    delete_failed: true
}, `${commandFramework.commandRegistry.getCommandTranslationPath("delrange")}.errors`);

async function deleteRange(msg: CommandRequest<true>, {
    startId,
    endId
}: {
    startId?: string;
    endId?: string;
}) {
    if (!(msg.channel as GuildTextBasedChannel).permissionsFor(msg.guild.members.me!).has(PermissionFlagsBits.ManageMessages))
        return errorLoc.cannot_manage_messages.path;

    if (startId || endId) {
        try {
            if (!startId)
                return errorLoc.invalid_message_range.path;
            if (!endId)
                endId = startId;
        
            if (BigInt(startId) < BigInt(endId))
                [startId, endId] = [endId, startId];
        } catch (e) {
            return errorLoc.invalid_message_range.path;
        }
    } else {
        const runtimeData = runtimeGuildData.getOrSetDefault(msg.guildId)
            .channels.getOrSetDefault(msg.channelId)
            .members.getOrSetDefault(msg.author.id);
        
        const range = runtimeData.messageSelectionRange;
        if (!range)
            return errorLoc.nothing_is_selected.path;
        
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
        return errorLoc.delete_failed.path;
    }
}

const command: CommandDefinition = {
    key: "delrange",
    args: [{
        key: "startId",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        key: "endId",
        type: ApplicationCommandOptionType.String,
        required: false
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    allowDMs: false,
    interactionCommand: true,
    handler: deleteRange
}
export default command;
