"use strict";

import { inspect } from "util";
import { Client, Message } from "discord.js";

/**
 * Evaluate code from text.
 * Auto-detects if evaluated code is one- or multi-statement.
 * 
 * @param {string} code Text to evaluate.
 * @param {Message} msg Context message, if present.
 */
export async function botEval(code, msg) {
    let response;

    const { client, data } = await import("../../env.js");
    void (client, data);

    try {
        try {
            response = await eval(`(async () => ${code})();`);
        } catch (e) {
            if (!(e instanceof SyntaxError))
                throw e;

            response = await eval(`(async () => {\n${code}\n})();`);
        }
    } catch (e) {
        response = e;
    }

    if (typeof response !== "string")
        response = inspect(response, { depth: 1 });

    return response;
}
