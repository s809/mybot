import { defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType } from "discord.js";
import sendLongText from "../modules/messages/sendLongText";
import { botEval } from "../modules/misc/eval";
import { coverSensitiveStrings } from "../util";

export default defineCommand({
    key: "eval",
    args: [{
        key: "code",
        type: ApplicationCommandOptionType.String,
        raw: true
    }],
    handler: async (req, { code }) => {
        await sendLongText(req.channel, coverSensitiveStrings(
            await botEval(code, req)
        ));
    },
    ownerOnly: true
});
