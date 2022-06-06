import { client, data, dataManager } from "../env";
import fetchAndCopyMessages from "../modules/messages/fetchAndCopyMessages";
import { onGuildCreate, onGuildRemove } from "../modules/data/dataSync";
import { botEval } from "../modules/misc/eval";
import { getLinks } from "../modules/data/channelLinking";
import { initBuffer } from "../modules/messages/messageCopying";

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}.`);

    // Remove missing guilds
    for (let guildId of Object.keys(data.guilds)) {
        if (!client.guilds.resolve(guildId))
            onGuildRemove({ id: guildId });
    }

    // Do NOT await anything before this block or some messages may get missed before copying.
    // Initialize buffers to get real time messages stay there until launch copy is started
    for (let [id] of Object.getOwnPropertyNames(data.guilds)
        .flatMap(guildId => getLinks(guildId, "DESTINATION"))) {
        initBuffer(id);
    }

    // Add new guilds
    for (let guild of client.guilds.cache.values())
        await onGuildCreate(guild);

    await dataManager.saveData();

    // Execute startup scripts
    for (let scriptName of Object.getOwnPropertyNames(data.scripts.startup)) {
        let result = await botEval(data.scripts.startup[scriptName], null, "startup/" + scriptName);
        console.log(`Executed ${scriptName}:\n${result}`);
    }

    // Message copying
    console.log("Pre-fetching linked messages...");
    await Promise.all(
        Object.getOwnPropertyNames(data.guilds)
            .flatMap(guildId => getLinks(guildId, "SOURCE"))
            .map(([id, link]) => fetchAndCopyMessages(id, link))
    );
    console.log("Started copying messages.");
});
