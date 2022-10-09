/**
 * @file Main bot file.
 */

import {
    client,
    token
} from "./env";
import { logDebug, logError } from "./log";
import { loadCommands } from "./modules/commands";
import { refreshCommands } from "./modules/commands/appCommands";
import "./database";

(async () => {
    logDebug("Running in debug mode.");
    
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
