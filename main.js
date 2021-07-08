/**
 * @file Main bot file.
 */
"use strict";

import {
    client,
    channelData,
    messageBuffers,
    pendingClones,
    version,
    prefix,
    owner,
    evalModeChannels,
    setPrefix
} from "./env.js";
import cloneChannel from "./modules/cloneChannel.js";
import commands from "./modules/commands.js";
import botEval from "./modules/eval.js";
import {
    sendWebhookMessageAuto,
    sendLongText
} from "./sendUtil.js";

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}.`);

    await client.user.setPresence({
        activity: {
            name: `v${version}`
        }
    });

    console.log("Syncing channels...");
    await Promise.all(
        [...channelData.mappedChannels.entries()]
        .map(entry => cloneChannel(entry[0], entry[1].lastMessage)
                      .catch(() => channelData.unmapChannel({ id: entry[0] }))));
    console.log("All channels are synced.");
});

client.on("message", async msg => {
    if (msg.guild) {
        let mappedChannel = channelData.mappedChannels.get(msg.channel.id);
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

    if (msg.author.bot || msg.webhookID) return;
    if (!msg.content.startsWith(prefix)) return;

    let args = msg.content.match(/[^" ]+|"(?:\\"|[^"])+"/g);
    args.forEach((str, i, arr) => {
        if (i === 0)
            str = str.slice(prefix.length);
        if (str.charAt(0) === "\"")
            str = str.slice(1, -1);

        arr[i] = str;
    });

    if (!msg.guild) return;

    let command, list = commands;
    for (; ;) {
        let found = list.get(args[0]);
        if (!found) break;

        if (found.ownerOnly && msg.author.id !== owner) return;
        command = found;

        list = command.subcommands;
        args.shift();
        if (!list) break;
    }

    if (command === undefined || !command.func) {
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

        if (!msg.deleted)
        {
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

if (process.argv.indexOf("--debug") < 0) {
    client.login("NzMzMjEyMjczNjkwMTQ4OTA0.Xw_3JA.7bDfmT2CPQySe9xIYgrJAb4yEGM"); // MyBot
}
else {
    console.log("(Warn) Running in debug mode.");
    setPrefix("t!");
    client.login("ODA5NDUxMzYzNzg0MzI3MjQ4.YCVSVA.J8BPawVSK4AgFvMQhLwiIZcVsUQ"); // TestNoise
}
