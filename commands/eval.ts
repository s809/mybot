import { ApplicationCommandOptionType } from "discord.js";
import { getPrefix } from "../modules/data/getPrefix";
import sendLongText from "../modules/messages/sendLongText";
import { botEval } from "../modules/misc/eval";
import { sanitizePaths, skipStringAfter } from "../util";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "eval",
    args: [{
        key: "code",
        type: ApplicationCommandOptionType.String,
        isExtras: true
    }],
    handler: async req => {
        await sendLongText(req.channel, sanitizePaths(
            await botEval(skipStringAfter(req.content,
                await getPrefix(req.guildId),
                "eval"
            ), req))
        );
    },
    ownerOnly: true
});
