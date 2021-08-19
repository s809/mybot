/**
 * @file Main bot file.
 */
"use strict";

import { inspect } from "util";
import {
    client,
    data,
    messageBuffers,
    pendingClones,
    version,
    prefix,
    owner,
    evalModeChannels,
    setPrefix,
    enableDebug,
    isDebug
} from "./env.js";
import cloneChannel from "./modules/cloneChannel.js";
import commands, { resolveCommand } from "./modules/commands.js";
import botEval from "./modules/eval.js";
import { getMappedChannelEntries } from "./modules/mappedChannels.js";
import { isCommandAllowedToUse } from "./modules/permissions.js";
import sendLongText from "./modules/sendLongText.js";
import { sendWebhookMessageAuto } from "./modules/sendWebhookMessage.js";
import { wrapText } from "./util.js";

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}.`);

    client.user.setPresence({
        activities: [{
            name: `v${version}${isDebug ? "-dev" : ""}`
        }]
    });

    // Add new guilds
    for (let guild of client.guilds.cache.values()) {
        data.guilds[guild.id] = {
            mappedChannels: {},
            roles: {},
            members: {},
            ...data.guilds[guild.id]
        };
        let guildData = data.guilds[guild.id];

        // Add new roles
        for (let role of guild.roles.cache.values()) {
            guildData.roles[role.id] = {
                allowedCommands: [],
                ...guildData.roles[role.id]
            };
        }

        // Remove missing roles
        for (let roleId of Object.getOwnPropertyNames(guildData.roles)) {
            if (!guild.roles.resolve(roleId))
                delete guildData.roles[roleId];
        }

        // Add users and new members
        for (let member of (await guild.members.fetch()).values()) {
            data.users[member.id] = {
                allowedCommands: [],
                flags: [],
                ...data.users[member.id]
            };

            guildData.members[member.id] = {
                allowedCommands: [],
                ...guildData.members[member.id]
            };
        }

        // Remove missing members
        for (let memberId of Object.getOwnPropertyNames(guildData.members)) {
            if (!guild.members.resolve(memberId))
                delete guildData.members[memberId];
        }
    }

    // Remove missing guilds
    for (let guildId of Object.keys(data.guilds)) {
        if (!await client.guilds.fetch(guildId))
            delete data.guilds[guildId];
    }

    data.saveData();

    // Execute startup scripts
    for (let scriptName of Object.getOwnPropertyNames(data.scripts.startup)) {
        await botEval({
            content: prefix + data.scripts.startup[scriptName],
            channel: {
                deleted: false,
                send: content => {
                    console.log(inspect(content));
                    return {
                        createMessageComponentCollector: () => { /* ignored */ }
                    };
                }
            },
            client: client
        });
    }

    console.log("Syncing channels...");
    await Promise.all(
        Object.keys(data.guilds).flatMap(guildId => getMappedChannelEntries(data.guilds[guildId]))
            .map(entry => cloneChannel(entry[0], entry[1].lastMessageId)));
    console.log("All channels are synced.");
});

client.on("guildCreate", async guild => {
    data.guilds[guild.id] ??= {
        mappedChannels: {},
        roles: {},
        members: {},
    };
});

client.on("guildDelete", async guild => {
    delete data.guilds[guild.id];
});

client.on("roleCreate", async role => {
    data.guilds[role.guild.id].roles[role.id] = {
        allowedCommands: []
    };
});

client.on("roleDelete", async role => {
    delete data.guilds[role.guild.id].roles[role.id];
});

client.on("guildMemberAdd", async member => {
    data.users[member.id] = {
        allowedCommands: [],
        flags: [],
        ...data.users[member.id]
    };

    data.guilds[member.guild.id].members[member.id] = {
        allowedCommands: []
    };
});

client.on("guildMemberRemove", async member => {
    if (member.id === client.user.id)
        delete data.guilds[member.guild.id];
    else
        delete data.guilds[member.guild.id].members[member.id];
});

client.on("messageCreate", async msg => {
    if (msg.guild) {
        let mappedChannel = data.guilds[msg.guild.id].mappedChannels[msg.channel.id];
        if (mappedChannel) {
            let buffer = messageBuffers.get(msg.channel);
            if (buffer && await client.channels.fetch(mappedChannel.id) === pendingClones.get(msg.channel)) {
                buffer.unshift(msg);
            }
            else {
                await sendWebhookMessageAuto(msg);
            }
        }
    }

    if (msg.author.bot || msg.webhookId) return;
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

    if (!command || !command.func) {
        if (evalModeChannels.includes(msg.channel) && msg.author.id === owner)
            await botEval(msg);
        return;
    }

    const minArgs = command.minArgs ?? 0;
    const maxArgs = command.maxArgs ?? 0;

    if (args.length < minArgs) {
        await msg.channel.send(`Provided arguments less than expected (need at least ${minArgs})`);
        await msg.react("❌");
        return;
    }
    else if (args.length > maxArgs) {
        await msg.channel.send(`Provided arguments more than expected (need at most ${maxArgs})`);
        await msg.react("❌");
        return;
    }

    try {
        let reaction = await msg.react("🔄");
        /** @type {boolean} */
        let ret;

        try {
            ret = await command.func(msg, ...args);
        }
        catch (e) {
            await sendLongText(msg.channel, e.stack);
        }

        if (!msg.deleted) {
            await Promise.allSettled([
                msg.react(ret ? "✅" : "❌"),
                reaction.users.remove()
            ]);
        }
    }
    catch (e) {
        console.error(e.stack);
    }
});

(async () => {
    if (process.argv.indexOf("--debug") < 0) {
        await client.login("NzMzMjEyMjczNjkwMTQ4OTA0.Xw_3JA.7bDfmT2CPQySe9xIYgrJAb4yEGM"); // MyBot
    }
    else {
        enableDebug();
        setPrefix("t!");
        await client.login("ODA5NDUxMzYzNzg0MzI3MjQ4.YCVSVA.J8BPawVSK4AgFvMQhLwiIZcVsUQ"); // TestNoise
    }

    process.on("uncaughtException", async (e, origin) => {
        let text = wrapText(origin, e.stack);

        if (client.user) {
            try {
                let user = await client.users.fetch(owner);
                let channel = await user.createDM();
                await channel.send({ content: text, split: true });
            }
            catch { /* Do nothing */ }
        }

        console.warn(text);
    });
})();
