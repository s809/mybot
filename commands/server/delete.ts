import { Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";

async function deleteServer(msg: Message<true>) {
    await msg.guild.delete();
}

const command: Command = {
    name: "delete",
    func: deleteServer
};
export default command;
