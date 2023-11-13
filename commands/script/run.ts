import { defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType } from "discord.js";
import { ScriptList } from "../../database/models";
import sendLongText from "../../modules/messages/sendLongText";
import { botEval } from "../../modules/misc/eval";
import { coverSensitiveStrings, formatString } from "../../util";

export default defineCommand({
    key: "run",
    args: [{
        key: "name",
        type: ApplicationCommandOptionType.String,
    }, {
        key: "args",
        type: ApplicationCommandOptionType.String,
        extras: true,
        required: false
    }],
    handler: async (msg, { name, args }) => {
        if (name.match(/[/\\]/))
            return "Invalid script name.";

        const value = (await ScriptList.findById("callable"))!.items.get(name);
        if (!value)
            return "Script with this name does not exist.";

        await sendLongText(msg, coverSensitiveStrings(await botEval(
            formatString(value, ...(args ?? [])),
            msg,
            "callable/" + name
        )));
    }
});
