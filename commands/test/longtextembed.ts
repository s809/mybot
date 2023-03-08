import { EmbedBuilder, Message } from "discord.js";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import sendLongText from "../../modules/messages/sendLongText";

async function test(msg: CommandRequest) {
    await sendLongText(msg, "ab".repeat(1500) + "\n" + "cd".repeat(2500), {
        embed: new EmbedBuilder({
            footer: {
                text: "AAAAAAAAAA"
            }
        }),
    });
}

export default defineCommand({
    key: "longtextembed",
    handler: test
});
