/* eslint-disable no-void */
/* eslint-disable no-eval */
import { inspect } from "util";
import { Message } from "discord.js";
import { getSrc } from "../data/UserDataManager.js";

/**
 * Evaluate code from text.
 * Auto-detects if evaluated code is one- or multi-statement.
 * 
 * @param {string} code Text to evaluate.
 * @param {Message} msg Context message, if present.
 * @returns
 */
export async function botEval(code, msg) {
    let response;

    const { client, data } = await import("../../env.js");
    void (msg, client, data, getSrc);

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
