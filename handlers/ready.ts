import { client } from "../env";
import { botEval } from "../modules/misc/eval";
import { log } from "../log";
import { ScriptList } from "../database/models";
import { syncGuild } from "../modules/data/dataSync";

client.on("ready", async () => {
    log(`Logged in as ${client.user!.tag}.`);

    // Add new guilds
    for (let guild of client.guilds.cache.values())
        await syncGuild(guild);
    
    // Execute startup scripts
    for (const [name, value] of (await ScriptList.findById("startup"))!.items) {
        const result = await botEval(value, null, "startup/" + name);
        log(`Executed ${name}:\n${result}`);
    }
});
