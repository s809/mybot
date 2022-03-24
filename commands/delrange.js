import { Translator } from "../modules/misc/Translator.js";
import { Permissions } from "discord.js";

async function deleteRange(msg, start, end) {
    start = parseInt(start);
    end = parseInt(end);

    if (start === undefined || end === undefined || start >= end)
        return Translator.get(msg).translate("errors.invalid_message_range");

    while (true) {
        let messages = await msg.channel.messages.fetch({ limit: 100, before: end + 1 });

        for (let msg of messages.values()) {
            if (msg.id < start)
                return;
            else
                await msg.delete();
        }

        if (messages.size < 100)
            return;
    }
}

export const name = "delrange";
export const args = "<startid> <endid>";
export const minArgs = 2;
export const maxArgs = 2;
export const managementPermissionLevel = Permissions.FLAGS.MANAGE_MESSAGES;
export const func = deleteRange;
