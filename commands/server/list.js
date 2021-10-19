import { TextChannel } from "discord.js";
import { client } from "../../env.js";

async function getOwnedServers(msg) {
    let result = "";

    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerId !== client.user.id) continue;

        /** @type {TextChannel} */
        let channel = [...guild.channels.cache.values()].find(channel => channel instanceof TextChannel);
        let invite = await channel.createInvite();
        result += invite.url + "\n";
    }

    if (result !== "")
        await msg.channel.send(result);
}

export const name = "list";
export const description = "list bot test servers";
export const minArgs = 0;
export const maxArgs = 0;
export const func = getOwnedServers;
