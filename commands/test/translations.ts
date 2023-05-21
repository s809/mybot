import { ApplicationCommandOptionType } from "discord.js";
import { CommandRequest } from "@s809/noisecord";
import { defineCommand } from "@s809/noisecord";

async function test(msg: CommandRequest, {
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
            await msg.replyOrEdit(
                "Global scope:\n"
                + `common.strings.test: ${translator.translate("common.strings.test")}\n`
                + `common.strings.test_missing: ${translator.translate("common.strings.test_missing")}\n`
                + "Local scope:\n"
                + `embeds.test: ${translator.translate("embeds.test")}\n`
                + `embeds.test_missing: ${translator.translate("embeds.test_missing")}\n`
            );
    }
}

export default defineCommand({
    key: "translations",
    args: [{
        key: "sendError",
        type: ApplicationCommandOptionType.String,
        choices: [{
            key: "raw",
            value: "raw"
        }, {
            key: "translate",
            value: "translate"
        }],
        required: false
    }],
    handler: test
});
