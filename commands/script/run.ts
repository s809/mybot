import { ApplicationCommandOptionType } from "discord.js";
import { botEval } from "../../modules/misc/eval";
import { formatString, sanitizePaths } from "../../util";
import sendLongText from "../../modules/messages/sendLongText";
import { CommandDefinition } from "../../modules/commands/definitions";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { ScriptList } from "../../database/models";

async function runScript(msg: CommandMessage, {
    name,
    args
}: {
    name: string;
    args: string[]
}) {
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

const command: CommandDefinition = {
    key: "run",
    args: [{
        translationKey: "name",
        type: ApplicationCommandOptionType.String,
    }, {
        translationKey: "args",
        type: ApplicationCommandOptionType.String,
        isExtras: true,
    }],
    handler: runScript
};
export default command;
