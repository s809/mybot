import { Message } from "discord.js";
import { CommandDefinition } from "../../../modules/commands/definitions";
import { setTimeout } from "timers/promises"
import { CommandMessage } from "../../../modules/commands/appCommands";

async function test(msg: CommandMessage) {
    await setTimeout(1000);
    await msg.reply("Test");
}

const command: CommandDefinition = {
    key: "slowcommand",
    handler: test
};
export default command;
