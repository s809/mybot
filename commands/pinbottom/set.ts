import { ApplicationCommandOptionType } from "discord.js";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { pinMessage } from "../../modules/messages/pinBottom";
import { commandFramework } from "../../env";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    no_content: true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("pinbottom/set")}.errors`);

async function setPinnedMessage(msg: CommandRequest<true>, {
    messageInterval,
    content
}: {
    messageInterval: number,
    content?: string
}) {
    if (!await pinMessage(msg.channel, messageInterval, content))
        return errorLoc.no_content.path;
}

export default defineCommand({
    key: "set",
    args: [{
        key: "messageInterval",
        type: ApplicationCommandOptionType.Integer,
        minValue: 10,
        maxValue: 100
    }, {
        key: "content",
        type: ApplicationCommandOptionType.String,
        required: false
    }],
    handler: setPinnedMessage
});
