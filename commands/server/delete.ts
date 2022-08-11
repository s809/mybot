import { Message } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";

async function deleteServer(msg: Message<true>) {
    await msg.guild.delete();
}

const command: CommandDefinition = {
    name: "delete",
    func: deleteServer,
    alwaysReactOnSuccess: true
};
export default command;
