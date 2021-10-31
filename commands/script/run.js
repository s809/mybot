import { Message } from "discord.js";
import { data } from "../../env.js";
import { botEval } from "../../modules/misc/eval.js";
import { sanitizePaths } from "../../util.js";
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
        data.scripts.callable[name].replaceAll(/\\?\$(\d+)/g, (match, value) => {
            if (match[0] === "\\")
                return match.slice(1);

            let replacedValue = args[parseInt(value) - 1];
            if (replacedValue === undefined)
                throw new Error(`Value for $${parseInt(value)} is missing`);
            return replacedValue;
        }),
        msg
    )));
}

export const name = "run";
export const minArgs = 1;
export const maxArgs = Infinity;
export const func = runScript;
