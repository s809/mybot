/**
 * @file Restart command.
 */
import { Message } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { doRestart } from "../../modules/misc/restart";

async function restart(msg: Message) {
    await doRestart(async () => {
        await msg.react("✅")
        await msg.reactions.resolve("🔄")?.users.remove();
    });
}

const command: CommandDefinition = {
    name: "restart",
    func: restart
};
export default command;
