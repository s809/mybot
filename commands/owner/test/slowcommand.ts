import { Message } from "discord.js";
import { Command } from "../../../modules/commands/definitions";
import { setTimeout } from "timers/promises"

async function test(msg: Message) {
    await setTimeout(1000);
    await msg.channel.send("Test");
}

const command: Command = {
    name: "slowcommand",
    func: test
};
export default command;
