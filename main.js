'use strict';

const env = require("./env.js");
const sendUtil = require("./sendUtil.js");

const commands = require("./requireHelper.js")("./commands");

const client = env.client;
const channelData = env.channelData;
const pendingClones = env.pendingClones;
const messageBuffers = env.messageBuffers;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}.`);

    client.user.setPresence({ activity: { name: "v" + require("./package.json").version } });

    client.guilds.cache.forEach(async guild => {
        let webhooks = await guild.fetchWebhooks();

        webhooks.forEach(async webhook => {
            let parts = webhook.name.split(" ");
            if (parts[0] === "Crosspost") {
                let wChannel = await client.channels.fetch(webhook.channelID);

                let channel = await client.channels.fetch(parts[1]);
                await channelData.mapChannel(channel, wChannel);

                let messages = await channel.messages.fetch();
                if (messages.size > 0)
                    await channelData.updateLastMessage(channel, messages.first());

                webhook.delete();
            }
        });
    });

    for (let entry of channelData.mappedChannels.entries()) {
        cloneChannel(entry[0], entry[1].lastMessage)
            .catch(() => env.channelData.unmapChannel({ id: entry[0] }));
    }
});

// Used when client is ready
async function cloneChannel(_channel, lastMessage) {
    let channel = await client.channels.fetch(_channel);
    let toChannel = await client.channels.fetch(channelData.mappedChannels.get(_channel).id);

    if (!channel.messages || !(channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]))) return;

    pendingClones.set(channel, toChannel);
    pendingClones.set(toChannel, channel);
    messageBuffers.set(channel, []);

    let messages = [...(await channel.messages.fetch({ after: lastMessage, limit: 100 })).values()];

    if (messages.length === 100) {
        let addedMessages;
        do {
            addedMessages = await channel.messages.fetch({ after: messages[0].id, limit: 100 });
            messages = [...addedMessages.values()].concat(messages);
        }
        while (addedMessages.size === 100);
    }

    messageBuffers.set(channel, messageBuffers.get(channel).concat(messages));

    while (messageBuffers.get(channel).length > 0) {
        let message = messageBuffers.get(channel).pop();
        await sendUtil.sendWebhookMessageAuto(message);
    }

    pendingClones.delete(channel);
    pendingClones.delete(toChannel);
    messageBuffers.delete(channel);

    return messages.length;
}

async function help(channel) {
    let response = "";

    const iterateSubcommands = (list, level = 0, fullCommand = "") => {
        for (let command of list) {
            if (command.ownerOnly && channel.recipient?.id !== env.owner) continue;

            response += `${level === 0 ? env.prefix : "  ".repeat(level)}${fullCommand + command.name}`;

            if (command.args)
                response += " " + command.args;

            if (command.description)
                response += ` - ${command.description}.`;
            else if (command.subcommands)
                response += ":";

            response += "\n";

            if (command.subcommands) {
                let newFullCommand = fullCommand;
                if (newFullCommand.length > 0 || command.args || command.description) {
                    if (level === 0)
                        newFullCommand = "!";
                    newFullCommand += command.name + " ";
                }

                iterateSubcommands(command.subcommands.values(), level + 1, newFullCommand);
            }
        }
    };
    iterateSubcommands(commands.values());

    await channel.send(response);
}

client.on("rateLimit", console.log);

client.on('message', async msg => {
    if (msg.guild) {
        let mappedChannel = channelData.mappedChannels.get(msg.channel.id);
        if (mappedChannel !== undefined) {
            let buffer = messageBuffers.get(msg.channel);
            if (buffer !== undefined && await client.channels.fetch(mappedChannel.id) === pendingClones.get(msg.channel)) {
                buffer.unshift(msg);
            }
            else {
                sendUtil.sendWebhookMessageAuto(msg);
            }
        }
    }

    if (msg.author.bot || msg.webhookID) return;
    if (!msg.content.startsWith(env.prefix)) return;

    let args = msg.content.match(/[^" ]+|"(?:\\"|[^"])+"/g);
    args.forEach((str, i, arr) => {
        if (i === 0)
            str = str.slice(1);
        if (str.charAt(0) === '"')
            str = str.slice(1, -1);

        arr[i] = str;
    });

    let command, list = commands;
    if (args[0] === "help") {
        await help(msg.channel);
        msg.react("✅");
        return;
    }

    if (!msg.guild) return;

    for (; ;) {
        let found = list?.get(args[0]);
        if (!found) break;

        if (found.ownerOnly && msg.author.id !== env.owner) return;

        command = found;
        list = command.subcommands;
        args.shift();
    }

    if (command === undefined || !command.func) {
        if (!(env.evalModeChannels.includes(msg.channel) && msg.author.id === env.owner)) return;

        try {
            let response;

            try {
                try {
                    response = await eval(`(async () => ${msg.content.substr(1)})();`);
                } catch (e) {
                    if (!(e instanceof SyntaxError))
                        throw e;

                    response = await eval(`(async () => { ${msg.content.substr(1)} })();`);
                }
            } catch (e) {
                if (msg.channel.deleted)
                    throw e;
                response = e;
            }

            response = require("util").inspect(response, { depth: 1 });
            await sendUtil.sendLongText(msg.channel, response);
        } catch (e) {
            console.log(e);
        }
        return;
    }

    if (args.length < command.minArgs) {
        msg.channel.send(`Provided arguments less than expected (need at least ${command.minArgs})`);
        msg.react("❌");
    }
    else if (args.length > command.maxArgs) {
        msg.channel.send(`Provided arguments more than expected (need at most ${command.maxArgs})`);
        msg.react("❌");
    }

    try {
        let reaction = await msg.react("🔄");
        let ret;

        try {
            ret = await command.func(msg, ...args);
        }
        catch (e) {
            await msg.channel.send(`${e.stack}`);
            await msg.react("❌");
        }

        if (ret)
            await msg.react("✅");
        else
            await msg.react("❌");

        await reaction.users.remove(client.user);
    }
    catch (e) {
        console.error(e.stack);
    }
});

if (require("os").hostname() === "instance-20201212-1309")
    client.login("NzMzMjEyMjczNjkwMTQ4OTA0.Xw_3JA.7bDfmT2CPQySe9xIYgrJAb4yEGM"); // MyBot
else
    client.login("ODA5NDUxMzYzNzg0MzI3MjQ4.YCVSVA.J8BPawVSK4AgFvMQhLwiIZcVsUQ") // TestNoise
