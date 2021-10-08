import { Message } from "discord.js";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";
import sendLongText from "../modules/messages/sendLongText.js";
import { botEval } from "../modules/misc/eval.js";
import { sanitizePaths } from "../util.js";

/**
 * @param {Message} msg 
 */
async function _eval(msg) {
    const cleanCode = msg.content.slice(msg.content.indexOf(name) + name.length).trimStart();

    await sendLongText(msg.channel, sanitizePaths(await botEval(cleanCode, msg)));
}

export const name = "eval";
export const args = "<code...>";
export const maxArgs = Infinity;
export const func = _eval;
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
