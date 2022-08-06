import { ChannelType, Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";

async function setupReceiverServer(msg: Message) {
    for (let channel of msg.guild.channels.cache.values())
        await channel.delete();

    let commandChannel = await msg.guild.channels.create({
        name: "commands",
        type: ChannelType.GuildText
    });
    let logChannel = await msg.guild.channels.create({
        name: "logs",
        type: ChannelType.GuildText
    });
    let deletedCategory = await msg.guild.channels.create({
        name: "Deleted Channels",
        type: ChannelType.GuildCategory
    });
    let rootCategory = await msg.guild.channels.create({
        name: "Root Category",
        type: ChannelType.GuildCategory
    });

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

const command: Command = {
    name: "setupreceiverserver",
    func: setupReceiverServer
};
export default command;

