import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function deleteServer(msg: CommandRequest<true>) {
    await msg.guild.delete();
}

export default defineCommand({
    key: "delete",
    handler: deleteServer,
});
