/**
 * @file Main bot file.
 */

import {
    client,
    owner,
    token
} from "./env.js";
import { loadCommands } from "./modules/commands/commands.js";
import { wrapText } from "./util.js";

(async () => {
    await loadCommands();
    
    await import("./handlers/index.js");
    await client.login(token);

    process.on("uncaughtException", async (e, origin) => {
        let text = wrapText(origin, e.stack);

        if (client.user) {
            try {
                let user = await client.users.fetch(owner);
                await user.send({ content: text, split: true });
            }
            catch { /* Do nothing */ }
        }

        console.warn(text);
    });
})();
