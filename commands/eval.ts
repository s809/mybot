import { ApplicationCommandOptionType } from "discord.js";
import sendLongText from "../modules/messages/sendLongText";
import { botEval } from "../modules/misc/eval";
import { sanitizePaths } from "../util";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "eval",
    args: [{
        key: "code",
        type: ApplicationCommandOptionType.String,
        raw: true
    }],
    handler: async (req, { code }) => {
        await sendLongText(req.channel, sanitizePaths(
            await botEval(code, req)
        ));
    },
    ownerOnly: true
});
