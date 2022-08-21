/**
 * @file Main bot file.
 */

import {
    client,
    token
} from "./env";
import { logError } from "./log";
import { loadCommands } from "./modules/commands";
import { refreshCommands } from "./modules/commands/appCommands";

(async () => {
    await loadCommands();
    
    await import("./handlers");
    await client.login(token);
    await client.application!.fetch();

    await refreshCommands();

    process.on("uncaughtException", async (e, origin) => {
        if (["write EPIPE", "write EOF"].includes(e.message)) {
            logError(e);
            return;
        }

        logError(e, origin);
    });
})();
