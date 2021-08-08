"use strict";

import Discord from "discord.js";
import { inspect } from "util";
import { prefix } from "../env.js";
import { sendLongText } from "../sendUtil.js";

/**
 * Evaluate code from message content.
 * Auto-detects if evaluated code is one- or multi-statement.
 * 
 * @param {Discord.Message} msg
 */
export default async function botEval(msg) {
    try {
        let expr = msg.content.substr(prefix.length);
        let response;

        try {
            try {
                response = await eval(`(async () => ${expr})();`); // jshint ignore: line
            } catch (e) {
                if (!(e instanceof SyntaxError))
                    throw e;

                response = await eval(`(async () => {\n${expr}\n})();`); // jshint ignore: line
            }
        } catch (e) {
            if (msg.channel.deleted)
                throw e;
            response = e;
        }

        response = inspect(response, { depth: 1 });
        await sendLongText(msg.channel, response);
    } catch (e) {
        console.log(e);
    }
}
