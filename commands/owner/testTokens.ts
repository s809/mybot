import { inspect } from "util";
import { Client, GatewayIntentBits, Message } from "discord.js";
import sendLongText from "../../modules/messages/sendLongText";
import { sendAlwaysLastMessage } from "../../modules/messages/AlwaysLastMessage";
import { once } from "events";
import { CommandDefinition } from "../../modules/commands/definitions";

async function testTokens(msg: Message, ...tokens: string[]) {
    let status = await sendAlwaysLastMessage(msg.channel, "Loading...");

    let results: Map<string, string[]> = new Map();
    for (let i = 0; i < tokens.length; i++) {
        status.edit(`Logging in with token ${i + 1} of ${tokens.length}...`);
        let token = tokens[i];

        let client = new Client({
            intents: (131072 - 1)
                ^ GatewayIntentBits.GuildMembers
                ^ GatewayIntentBits.GuildPresences
                ^ GatewayIntentBits.MessageContent,
            presence: {
                status: "invisible"
            }
        });

        try {
            await client.login(token);
            await once(client, "ready");

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
        await once(status, "editComplete");
    await status.delete();

    switch (results.size) {
        case 0:
            return "None of tokens are valid.";
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
}

const command: CommandDefinition = {
    name: "testtokens",
    args: [1, Infinity, "<tokens...>"],
    func: testTokens
};
export default command;
