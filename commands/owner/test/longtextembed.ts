import { EmbedBuilder, Message } from "discord.js";
import { CommandDefinition } from "../../../modules/commands/definitions";
import sendLongText from "../../../modules/messages/sendLongText";

async function test(msg: Message) {
    await sendLongText(msg.channel, "ab".repeat(1500) + "\n" + "cd".repeat(2500), {
        embed: new EmbedBuilder({
            footer: {
                text: "AAAAAAAAAA"
            }
        }),
    });
}

const command: CommandDefinition = {
    name: "longtextembed",
    func: test
};
export default command;
