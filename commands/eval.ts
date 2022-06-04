import { Message } from "discord.js";
import { Command } from "../modules/commands/definitions";
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

const command: Command = {
    name: "eval",
    args: [0, Infinity, "<code...>"],
    func: evalCommand,
    managementPermissionLevel: "BotOwner"
}
export default command;
