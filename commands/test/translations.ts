import { ApplicationCommandOptionType } from "discord.js";
import { CommandRequest } from "@s809/noisecord";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "translations",
    args: [{
        key: "sendError",
        type: ApplicationCommandOptionType.String,
        choices: [{
            key: "raw",
            value: "raw"
        }, {
            key: "translate_auto",
            value: "translate_auto"
        },
        {
            key: "translate_manual",
            value: "translate_manual"
        }],
        required: false
    }],

    translations: {
        embeds: {
            test: false
        },
        errors: {
            test_error: false
        }
    },

    handler: async (msg: CommandRequest, { sendError }, { embeds, errors }) => {
        let translator = msg.translator;
        switch (sendError) {
            case "raw":
                return "Test raw error";
            case "translate_auto":
                return errors.test_error;
            case "translate_manual":
                return "test_error";
            default:
                await msg.replyOrEdit(
                    "Global scope:\n"
                    + `common.strings.test: ${translator.translate("common.strings.test")}\n`
                    + `common.strings.test_missing: ${translator.translate("common.strings.test_missing")}\n`
                    + "Local scope (auto):\n"
                    + `embeds.test: ${embeds.test.translate()}\n`
                    + "Local scope (manual):\n"
                    + `embeds.test: ${translator.translate("embeds.test")}\n`
                    + `embeds.test_missing: ${translator.translate("embeds.test_missing")}\n`
                );
        }
    }
});
