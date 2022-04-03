import { Message } from "discord.js";
import { Command } from "../../../modules/commands/definitions";
import sendLongText from "../../../modules/messages/sendLongText";

async function test(msg: Message) {
    await sendLongText(msg.channel, "ab".repeat(1500) + "\n" + "cd".repeat(2500), {
        embed: {
            footer: {
                text: "AAAAAAAAAA"
            }
        },
    });
}

const command: Command = {
    name: "longtextembed",
    func: test
};
export default command;
