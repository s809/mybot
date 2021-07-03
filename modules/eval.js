"use strict";

import util from "util";
import { prefix } from "../env.js";
import { sendLongText } from "../sendUtil.js";

export default async function botEval(msg) {
    try {
        let response;

        try {
            try {
                response = await eval(`(async () => ${msg.content.substr(prefix.length)})();`); // jshint ignore: line
            } catch (e) {
                if (!(e instanceof SyntaxError))
                    throw e;

                response = await eval(`(async () => { ${msg.content.substr(prefix.length)} })();`); // jshint ignore: line
            }
        } catch (e) {
            if (msg.channel.deleted)
                throw e;
            response = e;
        }

        response = util.inspect(response, { depth: 1 });
        await sendLongText(msg.channel, response);
    } catch (e) {
        console.log(e);
    }
}
