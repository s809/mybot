import { EmbedBuilder, Message } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import sendLongText from "../../modules/messages/sendLongText";

async function test(msg: CommandMessage) {
    await sendLongText(msg, "ab".repeat(1500) + "\n" + "cd".repeat(2500), {
        embed: new EmbedBuilder({
            footer: {
                text: "AAAAAAAAAA"
            }
        }),
    });
}

const command: CommandDefinition = {
    key: "longtextembed",
    handler: test
};
export default command;
