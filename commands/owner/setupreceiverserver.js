import { Message } from "discord.js";

/**
 * @param {Message} msg
 */
async function setupReceiverServer(msg) {
    for (let channel of msg.guild.channels.cache.values())
        await channel.delete();

    let commandChannel = await msg.guild.channels.create("commands");
    let logChannel = await msg.guild.channels.create("logs");
    let deletedCategory = await msg.guild.channels.create("Deleted Channels", { type: "GUILD_CATEGORY" });
    let rootCategory = await msg.guild.channels.create("Root Category", { type: "GUILD_CATEGORY" });

    await commandChannel.send(
        `Fill \`senderToken\`, \`receiverToken\`, \`fromGuild\` and (optional) \`maxInitMessages\` with your data.
\`\`\`{
    "senderToken": "",
    "receiverToken": "",
    "commandChannel": "${commandChannel.id}",
    "logChannel": "${logChannel.id}",
    "rootCategory": "${rootCategory.id}",
    "deletedCategory": "${deletedCategory.id}",
    "fromGuild": "",
    "toGuild": "${msg.guild.id}",
    "maxInitMessages": 0
}\`\`\``);
}

export const name = "setupreceiverserver";
export const func = setupReceiverServer;
