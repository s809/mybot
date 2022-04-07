/**
 * @file Main bot file.
 */

import { Team } from "discord.js";
import {
    client,
    token
} from "./env";
import { loadCommands } from "./modules/commands/";
import { wrapText } from "./util";

(async () => {
    await loadCommands();
    
    await import("./handlers");
    await client.login(token);
    await client.application.fetch();

    process.on("uncaughtException", async (e, origin) => {
        if (["write EPIPE", "write EOF"].includes(e.message)) {
            console.warn(e.stack);
            return;
        }

        let text = wrapText(origin, e.stack);

        if (client.user) {
            try {
                let userOrTeam = client.application.owner;
                let user = userOrTeam instanceof Team ? userOrTeam.owner.user : userOrTeam;
                await user.send({ content: text });
            }
            catch { /* Do nothing */ }
        }

        console.warn(text);
    });
})();
