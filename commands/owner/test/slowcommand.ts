import { Message } from "discord.js";
import { CommandDefinition } from "../../../modules/commands/definitions";
import { setTimeout } from "timers/promises"

async function test(msg: Message) {
    await setTimeout(1000);
    await msg.channel.send("Test");
}

const command: CommandDefinition = {
    name: "slowcommand",
    func: test
};
export default command;
