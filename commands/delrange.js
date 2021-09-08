"use strict";

import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";

async function deleteRange(msg, start, end) {
    start = parseInt(start);
    end = parseInt(end);

    if (start === undefined || end === undefined || start >= end) {
        msg.channel.send("Enter a valid message range.");
        return false;
    }

    while (true) {
        let messages = await msg.channel.messages.fetch({ limit: 100, before: end + 1 });
        for (let msg of messages.values()) {
            if (msg.id < start)
                return true;
            else
                await msg.delete();
        }
        if (messages.size < 100)
            return true;
    }
}

export const name = "delrange";
export const description = "delete all messages within range";
export const args = "<startid> <endid>";
export const minArgs = 2;
export const maxArgs = 2;
export const managementPermissionLevel = CommandManagementPermissionLevel.SERVER_OWNER;
export const func = deleteRange;
