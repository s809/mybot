"use strict";

import Discord from "discord.js";
import { inspect } from "util";
import { prefix } from "../../env.js";
import { sanitizePaths } from "../../util.js";
import sendLongText from "../messages/sendLongText.js";

/**
 * Evaluate code from message content.
 * Auto-detects if evaluated code is one- or multi-statement.
 * 
 * @param {Discord.Message} msg Message with text to evaluate.
 */
export default async function botEval(msg) {
    try {
        let expr = msg.content.slice(prefix.length);
        let response;

        try {
            try {
                response = await eval(`(async () => ${expr})();`);
            } catch (e) {
                if (!(e instanceof SyntaxError))
                    throw e;

                response = await eval(`(async () => {\n${expr}\n})();`);
            }
        } catch (e) {
            if (msg.channel.deleted)
                throw e;
            response = e;
        }

        if (typeof response !== "string")
            response = inspect(response, { depth: 1 });
        await sendLongText(msg.channel, sanitizePaths(response));
    } catch (e) {
        console.log(e);
    }
}
