import { ApplicationCommandOptionType } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";

async function test(msg: CommandMessage, {
    sendError
}: {
    sendError?: "raw" | "translate"
}) {
    let translator = msg.translator;
    switch (sendError) {
        case "raw":
            return "Test raw error";
        case "translate":
            return "test_error";
        default:
            await msg.reply(
                "Global scope:\n"
                + `common.strings.test: ${translator.translate("common.strings.test")}\n`
                + `common.strings.test_missing: ${translator.translate("common.strings.test_missing")}\n`
                + "Local scope:\n"
                + `embeds.test: ${translator.translate("embeds.test")}\n`
                + `embeds.test_missing: ${translator.translate("embeds.test_missing")}\n`
            );
    }
}

const command: CommandDefinition = {
    key: "translations",
    args: [{
        translationKey: "sendError",
        type: ApplicationCommandOptionType.String,
        choices: [{
            translationKey: "raw",
            value: "raw"
        }, {
            translationKey: "translate",
            value: "translate" 
        }],
        required: false
    }],
    handler: test
};
export default command;
