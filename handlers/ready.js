import {
    client,
    data,
    version,
    isDebug
} from "../env.js";
import fetchAndCopyMessages from "../modules/messages/fetchAndCopyMessages.js";
import { onGuildCreate, onGuildRemove } from "../modules/data/dataSync.js";
import { botEval } from "../modules/misc/eval.js";
import { ChannelLinkRole, getLinks } from "../modules/data/channelLinking.js";
import { initBuffer } from "../modules/messages/messageCopying.js";

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}.`);

    client.user.setActivity(`v${version}${isDebug ? "-dev" : ""}`);

    // Remove missing guilds
    for (let guildId of Object.keys(data.guilds)) {
        if (!client.guilds.resolve(guildId))
            onGuildRemove({ id: guildId });
    }

    // Do NOT await anything before this statement or some messages may leak before copying.
    // Initialize buffers to get real time messages stay there until launch copy is started
    Object.getOwnPropertyNames(data.guilds)
        .flatMap(guildId => getLinks(guildId, ChannelLinkRole.DESTINATION))
        .forEach(([id]) => initBuffer(id));

    // Add new guilds
    for (let guild of client.guilds.cache.values())
        await onGuildCreate(guild);

    data.saveData();

    // Execute startup scripts
    for (let scriptName of Object.getOwnPropertyNames(data.scripts.startup)) {
        let result = await botEval(data.scripts.startup[scriptName]);
        console.log(`Executed ${scriptName}:\n${result}`);
    }

    console.log("Pre-fetching linked messages...");
    await Promise.all(
        Object.getOwnPropertyNames(data.guilds)
            .flatMap(guildId => getLinks(guildId, ChannelLinkRole.SOURCE))
            .map(([id, link]) => fetchAndCopyMessages(id, link))
    );
    console.log("Started copying channels.");
});
