import { Message, TextChannel } from "discord.js";
import { client } from "../../env";
import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition } from "../../modules/commands/definitions";

async function getOwnedServers(msg: CommandMessage) {
    let result = "";

    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerId !== client.user!.id) continue;

        let channel = [...guild.channels.cache.values()].find(channel => channel instanceof TextChannel) as TextChannel;
        let invite = await channel.createInvite();
        result += invite.url + "\n";
    }

    if (result !== "")
        await msg.reply(result);
}

const command: CommandDefinition = {
    key: "list",
    handler: getOwnedServers,
    alwaysReactOnSuccess: true
};
export default command;
