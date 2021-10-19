import { Message } from "discord.js";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";
import { getPrefix } from "../modules/commands/getPrefix.js";
import sendLongText from "../modules/messages/sendLongText.js";
import { botEval } from "../modules/misc/eval.js";
import { sanitizePaths, skipStringAfter } from "../util.js";

/**
 * @param {Message} msg
 */
async function _eval(msg) {
    await sendLongText(msg.channel, sanitizePaths(
        await botEval(skipStringAfter(msg.content,
            getPrefix(msg.guildId),
            name
        ), msg))
    );
}

export const name = "eval";
export const args = "<code...>";
export const maxArgs = Infinity;
export const func = _eval;
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
