/**
 * @file Main bot file.
 */

import {
    client,
    data,
    version,
    prefix,
    owner,
    isDebug,
    musicPlayingGuilds,
    token
} from "./env.js";
import fetchAndCopyMessages from "./modules/messages/fetchAndCopyMessages.js";
import { loadCommands, resolveCommand } from "./modules/commands/commands.js";
import {
    onChannelCreate,
    onChannelRemove,
    onGuildCreate,
    onGuildRemove,
    onMemberCreate,
    onMemberRemove,
    onRoleCreate,
    onRoleRemove
} from "./modules/data/dataSync.js";
import { botEval } from "./modules/misc/eval.js";
import { ChannelLinkRole, getLinks } from "./modules/data/channelLinking.js";
import { isCommandAllowedToUse } from "./modules/commands/permissions.js";
import sendLongText from "./modules/messages/sendLongText.js";
import { sanitizePaths, wrapText } from "./util.js";
import { hasFlag } from "./modules/data/flags.js";
import { copyMessageToLinkedChannel, initBuffer } from "./modules/messages/messageCopying.js";

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
        let result = await botEval(data.scripts.startup[scriptName], { client: client });
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

client.on("guildCreate", onGuildCreate);
client.on("guildDelete", onGuildRemove);

client.on("roleCreate", onRoleCreate);
client.on("roleDelete", onRoleRemove);

client.on("channelCreate", onChannelCreate);
client.on("channelDelete", onChannelRemove);

client.on("threadCreate", onChannelCreate);
client.on("threadDelete", onChannelRemove);

client.on("guildMemberAdd", onMemberCreate);
client.on("guildMemberRemove", onMemberRemove);

client.on("voiceStateUpdate", (oldState, newState) => {
    let voiceState = newState.guild.voiceStates.resolve(client.user.id);
    let player = musicPlayingGuilds.get(voiceState?.guild)?.player;

    if (!player) return;
    if (newState.id === client.user.id && !newState.channelId) {
        player.unpause();
        return;
    }

    let memberCount = voiceState.channel.members.size;
    if (memberCount === 1)
        player.pause();
    else if (memberCount === 2 && (!oldState.channelId || newState.channelId === voiceState.channelId))
        player.unpause();
});

client.on("messageCreate", async msg => {
    if (msg.guild) {
        /** @type {import("./modules/data/channelLinking.js").ChannelLink} */
        let link = data.guilds[msg.guildId].channels[msg.channelId].link;

        if (link?.role === ChannelLinkRole.SOURCE)
            await copyMessageToLinkedChannel(msg);
    }

    if (msg.author.bot || msg.webhookId) return;

    if (msg.author.id !== owner) {
        // User ban
        if (hasFlag(data.users[msg.author.id], "banned")) return;

        // Guild ban
        if (msg.guild)
            if (hasFlag(data.guilds[msg.guildId], "banned")) return;
    }

    if (!msg.content.startsWith(prefix)) return;

    let args = msg.content.match(/[^" ]+|"(?:\\"|[^"])+"/g);
    args.forEach((str, i, arr) => {
        if (i === 0)
            str = str.slice(prefix.length);
        if (str.charAt(0) === "\"")
            str = str.slice(1, -1);

        arr[i] = str;
    });

    let command = resolveCommand(args, true);
    if (command && !isCommandAllowedToUse(msg, command)) return;

    if (!command || !command.func) return;

    const minArgs = command.minArgs ?? 0;
    const maxArgs = command.maxArgs ?? 0;

    if (args.length < minArgs) {
        await msg.channel.send(`Provided arguments less than expected (need at least ${minArgs}`);
        await msg.react("❌");
        return;
    }
    else if (args.length > maxArgs) {
        await msg.channel.send(`Provided arguments more than expected (need at most ${maxArgs}`);
        await msg.react("❌");
        return;
    }

    try {
        let reaction = await msg.react("🔄");

        /** @type {string | undefined} */
        let result;
        try {
            result = await command.func(msg, ...args);
        }
        catch (e) {
            console.log(e.stack);
            await sendLongText(msg.channel, sanitizePaths(e.stack));
        }

        if (!msg.deleted) {
            await Promise.allSettled([
                msg.react(typeof result !== "string" ? "✅" : "❌"),
                reaction.users.remove(),
                (async () => {
                    if (typeof result === "string")
                        await msg.channel.send(result);
                })()
            ]);
        }
    }
    catch (e) {
        console.error(e.stack);
    }
});

(async () => {
    await loadCommands();
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
