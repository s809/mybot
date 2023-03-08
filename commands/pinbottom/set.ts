import { ApplicationCommandOptionType } from "discord.js";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { pinMessage } from "../../modules/messages/pinBottom";

async function setPinnedMessage(msg: CommandRequest<true>, {
    messageInterval,
    content
}: {
    messageInterval: number,
    content?: string
}) {
    if (!await pinMessage(msg.channel, messageInterval, content))
        return "no_content";
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
