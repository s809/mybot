/**
 * @file Main bot file.
 */

import { client, commandFramework } from "./env";
import { token } from "./constants";
import { logDebug, logError } from "./log";
import { install } from "source-map-support";
import "./database";

install();

(async () => {
    logDebug("Running in debug mode.");
    
    await import("./handlers");
    await commandFramework.init(client);
    await client.login(token);
    await client.application!.fetch();

    process.on("uncaughtException", async (e, origin) => {
        if (["write EPIPE", "write EOF"].includes(e.message)) {
            logError(e);
            return;
        }

        debugger;
        logError(e, origin);
    });
})();
