import { ApplicationCommandOptionType, GuildTextBasedChannel, PermissionFlagsBits } from "discord.js";
import { defineCommand } from "@s809/noisecord";
import { iterateMessagesChunked } from "../modules/messages/iterateMessages";
import { runtimeGuildData } from "../env";

export default defineCommand({
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

    translations: {
        errors: {
            cannot_manage_messages: true,
            invalid_message_range: true,
            nothing_is_selected: true,
            delete_failed: true
        }
    },

    handler: async (req, { startId, endId }, { errors }) => {
        if (!(req.channel as GuildTextBasedChannel).permissionsFor(req.guild.members.me!).has(PermissionFlagsBits.ManageMessages))
            return errors.cannot_manage_messages;

        if (startId || endId) {
            try {
                if (!startId)
                    return errors.invalid_message_range;
                if (!endId)
                    endId = startId;

                if (BigInt(startId) < BigInt(endId))
                    [startId, endId] = [endId, startId];
            } catch (e) {
                return errors.invalid_message_range;
            }
        } else {
            const runtimeData = runtimeGuildData.get(req.guildId)
                .channels.get(req.channelId)
                .members.get(req.author.id);

            const range = runtimeData.messageSelectionRange;
            if (!range)
                return errors.nothing_is_selected;

            startId = range.begin;
            endId = range.end;

            range.lastRequest?.response.delete();
            delete runtimeData.messageSelectionRange;
        }

        try {
            for await (let chunk of iterateMessagesChunked(req.channel, endId, startId)) {
                const bulkDeleted = await req.channel.bulkDelete(chunk, true);

                for (let message of chunk.filter(message => !bulkDeleted.has(message.id)))
                    await message.delete();
            }
        } catch (e) {
            return errors.delete_failed;
        }
    }
});
