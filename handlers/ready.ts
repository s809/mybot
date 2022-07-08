import { client, data, dataManager } from "../env";
import fetchAndCopyMessages from "../modules/messages/fetchAndCopyMessages";
import { onGuildCreate, onGuildRemove } from "../modules/data/dataSync";
import { botEval } from "../modules/misc/eval";
import { getLinks } from "../modules/data/channelLinking";
import { initBuffer } from "../modules/messages/messageCopying";
import { log } from "../log";

client.on("ready", () => {
    // Initialize buffers to get real time messages stay there until launch copy is started
    for (let [id] of Object.getOwnPropertyNames(data.guilds)
        .flatMap(guildId => getLinks(guildId, "Destination"))) {
        initBuffer(id);
    }
});

client.on("ready", async () => {
    log(`Logged in as ${client.user.tag}.`);

    // Unlink channels from missing guilds
    for (let guildId of Object.keys(data.guilds)) {
        if (!client.guilds.resolve(guildId))
            onGuildRemove({ id: guildId });
    }

    // Add new guilds
    for (let guild of client.guilds.cache.values())
        await onGuildCreate(guild);

    await dataManager.saveData();

    // Execute startup scripts
    for (let scriptName of Object.getOwnPropertyNames(data.scripts.startup)) {
        let result = await botEval(data.scripts.startup[scriptName], null, "startup/" + scriptName);
        log(`Executed ${scriptName}:\n${result}`);
    }

    // Message copying
    log("Pre-fetching linked messages...");
    await Promise.all(
        Object.getOwnPropertyNames(data.guilds)
            .flatMap(guildId => getLinks(guildId, "Source"))
            .map(([id, link]) => fetchAndCopyMessages(id, link))
    );
    log("Started copying messages.");
});
