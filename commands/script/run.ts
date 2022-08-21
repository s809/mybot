import { ApplicationCommandOptionType, Message } from "discord.js";
import { data } from "../../env";
import { botEval } from "../../modules/misc/eval";
import { formatString, sanitizePaths } from "../../util";
import sendLongText from "../../modules/messages/sendLongText";
import { CommandDefinition } from "../../modules/commands/definitions";
import { CommandMessage } from "../../modules/commands/appCommands";

async function runScript(msg: CommandMessage, name: string, ...args: string[]) {
    if (name.match(/[/\\]/))
        return "Invalid script name.";

    if (!(name in data.scripts.callable))
        return "Script with this name does not exist.";

    await sendLongText(msg, sanitizePaths(await botEval(
        formatString(data.scripts.callable[name], ...args),
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
        type: ApplicationCommandOptionType.String
    }],
    handler: runScript
};
export default command;
