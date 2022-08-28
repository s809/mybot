import { inspect } from "util";
import { ScriptContext } from "./ScriptContext";
import { CommandMessage } from "../commands/CommandMessage";

/**
 * Evaluate code from text.
 * Auto-detects if evaluated code is one- or multi-statement.
 * 
 * @param code Text to evaluate.
 * @param msg Context message, if present.
 * @param scriptName Name of the script, if present.
 * @returns
 */
export async function botEval(code: string, msg: CommandMessage | null, scriptName: string | null = null) {
    const { data, client: _client } = await import("../../env");
    const { getSrc } = await import("../data/UserDataManager");

    const _context = scriptName ? ScriptContext.getOrCreate(_client, scriptName) : null;
    
    const {
        setImmediate,
        clearImmediate,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
    } = _context ? _context.functions : global;
    const client = _context?.client ?? _client;

    let response;
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
