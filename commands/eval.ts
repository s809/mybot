import { ApplicationCommandOptionType } from "discord.js";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { CommandDefinition } from "../modules/commands/definitions";
import { BotOwner } from "../modules/commands/requirements";
import { getPrefix } from "../modules/data/getPrefix";
import sendLongText from "../modules/messages/sendLongText";
import { botEval } from "../modules/misc/eval";
import { sanitizePaths, skipStringAfter } from "../util";

async function evalCommand(msg: CommandMessage) {
    await sendLongText(msg.channel, sanitizePaths(
        await botEval(skipStringAfter(msg.content!,
            getPrefix(msg.guildId),
            "eval"
        ), msg))
    );
}

const command: CommandDefinition = {
    key: "eval",
    args: [{
        translationKey: "code",
        type: ApplicationCommandOptionType.String,
        isExtras: true
    }],
    handler: evalCommand,
    requirements: BotOwner
}
export default command;
