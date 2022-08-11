import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";

async function delAllServers() {
    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerId !== client.user!.id) continue;

        await guild.delete();
    }
}

const command: Command = {
    name: "delall",
    func: delAllServers
};
export default command;
