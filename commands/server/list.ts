import { Message, TextChannel } from "discord.js";
import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";

async function getOwnedServers(msg: Message) {
    let result = "";

    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerId !== client.user.id) continue;

        let channel = [...guild.channels.cache.values()].find(channel => channel instanceof TextChannel) as TextChannel;
        let invite = await channel.createInvite();
        result += invite.url + "\n";
    }

    if (result !== "")
        await msg.channel.send(result);
}

const command: Command = {
    name: "list",
    func: getOwnedServers
};
export default command;
