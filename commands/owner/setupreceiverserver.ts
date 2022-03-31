import { Message } from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";
import { Command } from "../../modules/commands/definitions";

async function setupReceiverServer(msg: Message) {
    for (let channel of msg.guild.channels.cache.values())
        await channel.delete();

    let commandChannel = await msg.guild.channels.create("commands", {
        type: ChannelTypes.GUILD_TEXT
    });
    let logChannel = await msg.guild.channels.create("logs", {
        type: ChannelTypes.GUILD_TEXT
    });
    let deletedCategory = await msg.guild.channels.create("Deleted Channels", {
        type: ChannelTypes.GUILD_CATEGORY
    });
    let rootCategory = await msg.guild.channels.create("Root Category", {
        type: ChannelTypes.GUILD_CATEGORY
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

