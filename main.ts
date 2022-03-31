/**
 * @file Main bot file.
 */

import {
    client,
    owner,
    token
} from "./env";
import { loadCommands } from "./modules/commands/";
import { wrapText } from "./util";

(async () => {
    await loadCommands();
    
    await import("./handlers");
    await client.login(token);

    process.on("uncaughtException", async (e, origin) => {
        if (["write EPIPE", "write EOF"].includes(e.message)) {
            console.warn(e.stack);
            return;
        }

        let text = wrapText(origin, e.stack);

        if (client.user) {
            try {
                let user = await client.users.fetch(owner);
                await user.send({ content: text });
            }
            catch { /* Do nothing */ }
        }

        console.warn(text);
    });
})();
