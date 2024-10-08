import { inspect } from "util";
import { ScriptContext } from "./ScriptContext";
import { CommandRequest } from "@s809/noisecord";

/**
 * Evaluate code from text.
 * Auto-detects if evaluated code is one- or multi-statement.
 * 
 * @param code Text to evaluate.
 * @param msg Context message, if present.
 * @param scriptName Name of the script, if present.
 * @returns
 */
export async function botEval(code: string, msg: CommandRequest | null, scriptName: string | null = null) {
    const { client: _client } = await import("../../env");
    const { Guild: DbGuild, User: DbUser } = await import("../../database/models");

    const _context = scriptName ? ScriptContext.getOrCreate(_client, scriptName) : null;
    
    const {
        setImmediate,
        clearImmediate,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
    } = _context?.functions ?? global;
    const client = _context?.client ?? _client;

    let response;
    try {
        try {
            response = await eval(`(async () => (\n${code}\n))();`);
        } catch (e) {
            if (!(e instanceof SyntaxError))
                throw e;

            response = await eval(`(async () => {\n${code}\n})();`);
        }
    } catch (e) {
        response = e;
    }

    switch (typeof response) {
        case "function":
            response = response.toString();
            break;
        case "string":
            break;
        default:
            response = inspect(response, { depth: 1 });
            break;
    }

    return response;
}
