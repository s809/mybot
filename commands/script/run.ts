import { Message } from "discord.js";
import { data } from "../../env";
import { botEval } from "../../modules/misc/eval";
import { formatString, sanitizePaths } from "../../util";
import sendLongText from "../../modules/messages/sendLongText";
import { Command } from "../../modules/commands/definitions";

async function runScript(msg: Message, name: string, ...args: string[]) {
    if (name.match(/[/\\]/))
        return "Invalid script name.";

    if (!(name in data.scripts.callable))
        return "Script with this name does not exist.";

    await sendLongText(msg.channel, sanitizePaths(await botEval(
        formatString(data.scripts.callable[name], ...args),
        msg
    )));
}

const command: Command = {
    name: "run",
    args: [1, Infinity, "<name> <args...>"],
    func: runScript
};
export default command;
