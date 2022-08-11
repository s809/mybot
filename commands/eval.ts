import { Message } from "discord.js";
import { CommandDefinition } from "../modules/commands/definitions";
import { BotOwner } from "../modules/commands/requirements";
import { getPrefix } from "../modules/data/getPrefix";
import sendLongText from "../modules/messages/sendLongText";
import { botEval } from "../modules/misc/eval";
import { sanitizePaths, skipStringAfter } from "../util";

async function evalCommand(msg: Message) {
    await sendLongText(msg.channel, sanitizePaths(
        await botEval(skipStringAfter(msg.content,
            getPrefix(msg.guildId),
            "eval"
        ), msg))
    );
}

const command: CommandDefinition = {
    name: "eval",
    args: [0, Infinity, "<code...>"],
    func: evalCommand,
    requirements: BotOwner
}
export default command;
