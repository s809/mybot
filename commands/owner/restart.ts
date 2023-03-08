/**
 * @file Restart command.
 */
import { defineCommand, MessageCommandRequest } from "@s809/noisecord";
import { doRestart } from "../../modules/misc/restart";

async function restart(msg: MessageCommandRequest) {
    const message = msg.message;
    
    await doRestart(async () => {
        await message.react("✅")
        await message.reactions.resolve("🔄")?.users.remove();
    });
}

export default defineCommand({
    key: "restart",
    handler: restart
});
