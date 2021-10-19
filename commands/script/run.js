import { Message } from "discord.js";
import { data } from "../../env.js";
import { botEval } from "../../modules/misc/eval.js";
import { sanitizePaths } from "../../util.js";
import sendLongText from "../../modules/messages/sendLongText.js";

/**
 * @param {Message} msg
 * @param {string} name
 */
async function runScript(msg, name) {
    if (name.match(/[/\\]/))
        return "Invalid script name.";

    if (!(name in data.scripts.callable))
        return "Script with this name does not exist.";

    await sendLongText(msg.channel, sanitizePaths(await botEval(data.scripts.callable[name], {
        msg: msg,
        client: msg.client
    })));
}

export const name = "run";
export const minArgs = 1;
export const maxArgs = 1;
export const func = runScript;
