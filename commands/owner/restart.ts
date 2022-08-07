/**
 * @file Restart command.
 */
import { Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { doRestart } from "../../modules/misc/restart";

async function restart(msg: Message) {
    await doRestart(async () => {
        await msg.reactions.resolve("🔄")?.users.remove();
        await msg.react("✅")
    });
}

const command: Command = {
    name: "restart",
    func: restart
};
export default command;
