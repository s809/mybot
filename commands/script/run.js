import { Message } from "discord.js";
import { data } from "../../env.js";
import { botEval } from "../../modules/misc/eval.js";
import { formatString, sanitizePaths } from "../../util.js";
import sendLongText from "../../modules/messages/sendLongText.js";

/**
 * @param {Message} msg
 * @param {string} name
 */
async function runScript(msg, name, ...args) {
    if (name.match(/[/\\]/))
        return "Invalid script name.";

    if (!(name in data.scripts.callable))
        return "Script with this name does not exist.";

    await sendLongText(msg.channel, sanitizePaths(await botEval(
        formatString(data.scripts.callable[name], ...args),
        msg
    )));
}

export const name = "run";
export const minArgs = 1;
export const maxArgs = Infinity;
export const func = runScript;
