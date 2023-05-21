import { Message, TextChannel } from "discord.js";
import { client } from "../../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function getOwnedServers(msg: CommandRequest) {
    let result = "";

    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerId !== client.user!.id) continue;

        let channel = [...guild.channels.cache.values()].find(channel => channel instanceof TextChannel) as TextChannel;
        let invite = await channel.createInvite();
        result += invite.url + "\n";
    }

    if (result !== "")
        await msg.replyOrEdit(result);
}

export default defineCommand({
    key: "list",
    handler: getOwnedServers,
});
