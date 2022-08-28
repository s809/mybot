import { Message } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function test(msg: CommandMessage) {
    let translator = Translator.getOrDefault(msg);
    await msg.reply(
        translator.translate("common.test") + "\n"
        + translator.tryTranslate("common.test") + "\n"
        + translator.translate("common.test_missing") + "\n"
        + translator.tryTranslate("common.test_missing") + "\n"
    );
}

const command: CommandDefinition = {
    key: "translations",
    handler: test
};
export default command;
