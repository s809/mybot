import { ApplicationCommandOptionType } from "discord.js";
import { CommandRequest } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { getPrefix } from "../modules/data/getPrefix";
import sendLongText from "../modules/messages/sendLongText";
import { botEval } from "../modules/misc/eval";
import { sanitizePaths, skipStringAfter } from "../util";

async function evalCommand(msg: CommandRequest) {
    await sendLongText(msg.channel, sanitizePaths(
        await botEval(skipStringAfter(msg.content!,
            await getPrefix(msg.guildId),
            "eval"
        ), msg))
    );
}

const command: CommandDefinition = {
    key: "eval",
    args: [{
        key: "code",
        type: ApplicationCommandOptionType.String,
        isExtras: true
    }],
    handler: evalCommand,
    ownerOnly: true
}
export default command;
