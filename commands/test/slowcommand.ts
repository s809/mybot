import { Message } from "discord.js";
import { CommandDefinition, defineCommand } from "@s809/noisecord";
import { setTimeout } from "timers/promises"
import { CommandRequest } from "@s809/noisecord";

async function test(msg: CommandRequest) {
    await setTimeout(1000);
    await msg.reply("Test");
}

export default defineCommand({
    key: "slowcommand",
    handler: test
});
