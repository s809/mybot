import { Translator } from "../modules/misc/Translator";
import { Message, Permissions } from "discord.js";
import { Command } from "../modules/commands/definitions";

async function deleteRange(msg: Message, start: string, end: string) {
    let parsedStart = BigInt(start);
    let parsedEnd = BigInt(end);

    if (parsedStart === undefined || parsedEnd === undefined || parsedStart >= parsedEnd)
        return Translator.get(msg).translate("errors.invalid_message_range");

    while (true) {
        let messages = await msg.channel.messages.fetch({ limit: 100, before: (parsedEnd + 1n).toString() });

        for (let msg of messages.values()) {
            if (BigInt(msg.id) < BigInt(start))
                return;
            else
                await msg.delete();
        }

        if (messages.size < 100)
            return;
    }
}

const command: Command = {
    name: "delrange",
    args: [2, 2, "<startid> <endid>"],
    managementPermissionLevel: Permissions.FLAGS.MANAGE_MESSAGES,
    func: deleteRange
}
export default command;
