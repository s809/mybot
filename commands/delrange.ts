import { Translator } from "../modules/misc/Translator";
import { GuildTextBasedChannel, Message, PermissionFlagsBits } from "discord.js";
import { Command } from "../modules/commands/definitions";
import { iterateMessagesChunked } from "../modules/messages/iterateMessages";
import { ServerPermissions } from "../modules/commands/requirements";

async function deleteRange(msg: Message<true>, start: string, end: string) {
    const translator = Translator.getOrDefault(msg);

    if (!(msg.channel as GuildTextBasedChannel).permissionsFor(msg.guild.members.me!).has(PermissionFlagsBits.ManageMessages))
        return translator.translate("errors.cannot_manage_messages");

    try {
        if (BigInt(start) > BigInt(end))
            [start, end] = [end, start];
    } catch (e) {
        return translator.translate("errors.invalid_message_range");
    }

    try {
        for await (let chunk of iterateMessagesChunked(msg.channel, start, end)) {
            const bulkDeleted = await (msg.channel as GuildTextBasedChannel).bulkDelete(chunk, true);
            
            for (let message of chunk.filter(message => !bulkDeleted.has(message.id)))
                await message.delete();
        }
    } catch (e) {
        return translator.translate("errors.delete_failed");
    }
}

const command: Command = {
    name: "delrange",
    args: [2, 2, "<startid> <endid>"],
    requirements: ServerPermissions(PermissionFlagsBits.ManageMessages),
    func: deleteRange
}
export default command;
