/* eslint-disable no-void */
/* eslint-disable no-eval */
import { inspect } from "util";
import { Message } from "discord.js";

/**
 * Evaluate code from text.
 * Auto-detects if evaluated code is one- or multi-statement.
 * 
 * @param code Text to evaluate.
 * @param msg Context message, if present.
 * @returns
 */
export async function botEval(code: string, msg: Message = null) {
    let response;

    const { client, data } = await import("../../env");
    const { getSrc } = await import("../data/UserDataManager");

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
