'use strict';

const env = require("./env.js");
const cloneChannel = require("./modules/cloneChannel.js");
const commands = require("./modules/commands.js");
const botEval = require("./modules/eval.js");
const sendUtil = require("./sendUtil.js");

env.client.on('ready', async () => {
    console.log(`Logged in as ${env.client.user.tag}.`);

    await env.client.user.setPresence({ activity: { name: "v" + require("./package.json").version } });

    for (let guild of env.client.guilds.cache.values()) {
        let webhooks = await guild.fetchWebhooks();

        // Convert "Crosspost *" webhooks
        for (let webhook of webhooks.values()) {
            let parts = webhook.name.split(" ");

            if (parts[0] === "Crosspost") {
                let wChannel = await env.client.channels.fetch(webhook.channelID);

                let channel = await env.client.channels.fetch(parts[1]);
                await env.channelData.mapChannel(channel, wChannel);

                let messages = await channel.messages.fetch();
                if (messages.size > 0)
                    await env.channelData.updateLastMessage(channel, messages.first());

                webhook.delete();
            }
        }
    }

    for (let entry of env.channelData.mappedChannels.entries()) {
        cloneChannel(entry[0], entry[1].lastMessage)
            .catch(() => env.channelData.unmapChannel({ id: entry[0] }));
    }
});

env.client.on("rateLimit", console.log);

env.client.on('message', async msg => {
    if (msg.guild) {
        let mappedChannel = env.channelData.mappedChannels.get(msg.channel.id);
        if (mappedChannel !== undefined) {
            let buffer = env.messageBuffers.get(msg.channel);
            if (buffer !== undefined && await env.client.channels.fetch(mappedChannel.id) === env.pendingClones.get(msg.channel)) {
                buffer.unshift(msg);
            }
            else {
                await sendUtil.sendWebhookMessageAuto(msg);
            }
        }
    }

    if (msg.author.bot || msg.webhookID) return;
    if (!msg.content.startsWith(env.prefix)) return;

    let args = msg.content.match(/[^" ]+|"(?:\\"|[^"])+"/g);
    args.forEach((str, i, arr) => {
        if (i === 0)
            str = str.slice(env.prefix.length);
        if (str.charAt(0) === '"')
            str = str.slice(1, -1);

        arr[i] = str;
    });

    if (!msg.guild) return;

    let command, list = commands;
    for (; ;) {
        let found = list?.get(args[0]);
        if (!found) break;

        if (found.ownerOnly && msg.author.id !== env.owner) return;

        command = found;
        list = command.subcommands;
        args.shift();
    }

    if (command === undefined || !command.func) {
        if (env.evalModeChannels.includes(msg.channel) && msg.author.id === env.owner)
            await botEval(msg);
        return;
    }

    if (args.length < command.minArgs) {
        await msg.channel.send(`Provided arguments less than expected (need at least ${command.minArgs})`);
        await msg.react("❌");
    }
    else if (args.length > command.maxArgs) {
        await msg.channel.send(`Provided arguments more than expected (need at most ${command.maxArgs})`);
        await msg.react("❌");
    }

    try {
        let reaction = await msg.react("🔄");
        let ret;

        try {
            ret = await command.func(msg, ...args);
        }
        catch (e) {
            await sendUtil.sendLongText(msg.channel, e.stack);
            await msg.react("❌");
        }

        if (ret)
            await msg.react("✅");
        else
            await msg.react("❌");

        await reaction.users.remove(env.client.user);
    }
    catch (e) {
        console.error(e.stack);
    }
});

if (process.argv.indexOf("--debug") < 0) {
    env.client.login("NzMzMjEyMjczNjkwMTQ4OTA0.Xw_3JA.7bDfmT2CPQySe9xIYgrJAb4yEGM"); // MyBot
}
else {
    console.log("(Warn) Running in debug mode.")
    env.client.login("ODA5NDUxMzYzNzg0MzI3MjQ4.YCVSVA.J8BPawVSK4AgFvMQhLwiIZcVsUQ"); // TestNoise
    env.prefix = "t!";
}
