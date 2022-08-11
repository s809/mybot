import { Message } from "discord.js";
import { CommandDefinition } from "../../../modules/commands/definitions";
import { Translator } from "../../../modules/misc/Translator";

async function test(msg: Message) {
    let translator = Translator.getOrDefault(msg);
    await msg.channel.send(
        translator.translate("common.test") + "\n"
        + translator.tryTranslate("common.test") + "\n"
        + translator.translate("common.test_missing") + "\n"
        + translator.tryTranslate("common.test_missing") + "\n"
    );
}

const command: CommandDefinition = {
    name: "translations",
    func: test
};
export default command;
