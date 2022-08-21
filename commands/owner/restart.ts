/**
 * @file Restart command.
 */
import { Message } from "discord.js";
import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition } from "../../modules/commands/definitions";
import { doRestart } from "../../modules/misc/restart";

async function restart(msg: CommandMessage) {
    await doRestart(async () => {
        if (!msg.interaction) {
            await msg.message!.react("✅")
            await msg.message!.reactions.resolve("🔄")?.users.remove();
        }
    });
}

const command: CommandDefinition = {
    key: "restart",
    handler: restart
};
export default command;
