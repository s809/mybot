import { Message } from "discord.js";
import { data } from "../../env.js";
import sendLongText from "../../modules/messages/sendLongText.js";

/**
 * @param {Message} msg
 */
async function listScripts(msg) {
    let result = "";

    for (let type of Object.keys(data.scripts)) {
        result += `${type}:\n`;

        for (let name of Object.getOwnPropertyNames(data.scripts[type])) {
            result += `- ${name}\n`;
        }
    }

    await sendLongText(msg.channel, result.slice(0, -1));
}

export const name = "list";
export const minArgs = 0;
export const maxArgs = 0;
export const func = listScripts;
