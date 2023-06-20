import { ApplicationCommandOptionType } from "discord.js";
import { botEval } from "../../modules/misc/eval";
import { formatString, sanitizePaths } from "../../util";
import sendLongText from "../../modules/messages/sendLongText";
import { defineCommand } from "@s809/noisecord";
import { ScriptList } from "../../database/models";

export default defineCommand({
    key: "run",
    args: [{
        key: "name",
        type: ApplicationCommandOptionType.String,
    }, {
        key: "args",
        type: ApplicationCommandOptionType.String,
        extras: true,
    }],
    handler: async (msg, { name, args }) => {
        if (name.match(/[/\\]/))
        return "Invalid script name.";

        const value = (await ScriptList.findById("callable"))!.items.get(name);
        if (!value)
            return "Script with this name does not exist.";

        await sendLongText(msg, sanitizePaths(await botEval(
            formatString(value, ...args),
            msg,
            "callable/" + name
        )));
    }
});
