"use strict";

import { inspect } from "util";
import { Client, Intents } from "discord.js";
import { sendLongText } from "../../sendUtil.js";

async function testToken(msg, token) {
    let client = new Client({
        intents: Object.values(Intents.FLAGS)
            .filter(x => x !== Intents.FLAGS.GUILD_PRESENCES &&
                x !== Intents.FLAGS.GUILD_MEMBERS)
    });

    try {
        await client.login(token);
        client.user.setPresence({ status: "invisible" });
        await new Promise(resolve => client.on("ready", resolve));

        let guilds = client.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            channels: guild.channels.cache.map(channel => ({
                id: channel.id,
                name: channel.name,
            })),
        }));

        await sendLongText(msg.channel, `User info:\n${inspect(client.user, { depth: 1 })}`);
        await sendLongText(msg.channel, `Guild list:\n${inspect(guilds, { depth: null })}`);
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

export const name = "testtoken";
export const args = "<token>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = testToken;
