"use strict";

const util = require("util");
const Discord = require("discord.js");
const sendUtil = require("../../sendUtil");

async function testToken(msg, token) {
    let client = new Discord.Client();

    try {
        await client.login(token);
        await client.user.setPresence({ status: "invisible" });
        await new Promise(resolve => client.on("ready", resolve));

        let guilds = client.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            channels: guild.channels.cache.map(channel => ({
                id: channel.id,
                name: channel.name,
            })),
        }));

        await sendUtil.sendLongText(msg.channel, `User info:\n${util.inspect(client.user, { depth: 1 })}`);
        await sendUtil.sendLongText(msg.channel, `Guild list:\n${util.inspect(guilds, { depth: null })}`);
    }
    catch {
        await msg.channel.send("Token is invalid.");
        return false;
    }
    finally {
        client.destroy();
    }

    return true;
}

module.exports = {
    name: "testtoken",
    args: "<token>",
    minArgs: 1,
    maxArgs: 1,
    func: testToken,
};
