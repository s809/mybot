"use strict";

import { inspect } from "util";
import { Client, Intents, Message } from "discord.js";
import { awaitEvent } from "../../util.js";
import sendLongText from "../../modules/messages/sendLongText.js";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage.js";

/**
 * 
 * @param {Message} msg 
 * @param  {...string} tokens 
 * @returns 
 */
async function testTokens(msg, ...tokens) {
    let status = await sendAlwaysLastMessage(msg.channel, "Loading...");

    /** @type {Map<string, string[]>} */
    let results = new Map();
    for (let i = 0; i < tokens.length; i++) {
        status.edit(`Logging in with token ${i + 1} of ${tokens.length}...`);
        let token = tokens[i];

        let client = new Client({
            intents: Object.values(Intents.FLAGS)
                .filter(x => x !== Intents.FLAGS.GUILD_PRESENCES &&
                    x !== Intents.FLAGS.GUILD_MEMBERS)
        });

        try {
            await client.login(token);
            client.user.setPresence({ status: "invisible" });
            await awaitEvent(client, "ready");

            let guilds = client.guilds.cache.map(guild => ({
                id: guild.id,
                name: guild.name,
                channels: guild.channels.cache.map(channel => ({
                    id: channel.id,
                    name: channel.name,
                })),
            }));

            results.set(token, [
                `User info:\n${inspect(client.user, { depth: 1 })}`,
                `Guild list:\n${inspect(guilds, {
                    depth: null,
                    maxArrayLength: Infinity,
                    maxStringLength: Infinity
                })}`
            ]);
        }
        catch { /* Ignored */ }
        finally {
            client.destroy();
        }
    }

    if (status.editing)
        await awaitEvent(status, "editComplete");
    await status.delete();

    switch (results.size) {
        case 0:
            await msg.channel.send("None of tokens are valid.");
            break;
        case 1:
            for (let item of [...results.values()][0])
                await sendLongText(msg.channel, item);
            break;
        default: {
            let str = "";
            for (let pair of results) {
                str += pair[0] + ":\n";
                
                for (let item of pair[1])
                    str += item + "\n";
                
                str += "\n";
            }
            await msg.channel.send({
                content: `Valid token count: ${results.size} of ${tokens.length}`,
                files: [{
                    name: "results.txt",
                    attachment: Buffer.from(str)
                }]
            });
        }
    }

    return true;
}

export const name = "testtokens";
export const args = "<tokens...>";
export const minArgs = 1;
export const maxArgs = Infinity;
export const func = testTokens;
