import { client, data, dataManager } from "../env";
import { onGuildCreate } from "../modules/data/dataSync";
import { botEval } from "../modules/misc/eval";
import { log } from "../log";

client.on("ready", async () => {
    log(`Logged in as ${client.user!.tag}.`);

    // Add new guilds
    for (let guild of client.guilds.cache.values())
        await onGuildCreate(guild);

    await dataManager.saveData();

    // Execute startup scripts
    for (let scriptName of Object.getOwnPropertyNames(data.scripts.startup)) {
        let result = await botEval(data.scripts.startup[scriptName], null, "startup/" + scriptName);
        log(`Executed ${scriptName}:\n${result}`);
    }
});
