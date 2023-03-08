import { client } from "../../env";
import { CommandDefinition, defineCommand } from "@s809/noisecord";

async function delAllServers() {
    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerId !== client.user!.id) continue;

        await guild.delete();
    }
}

export default defineCommand({
    key: "delall",
    handler: delAllServers
});
