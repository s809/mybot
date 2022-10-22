import { ApplicationCommandOptionType } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { pinMessage } from "../../modules/messages/pinBottom";

async function setPinnedMessage(msg: CommandMessage<true>, {
    messageInterval,
    content
}: {
    messageInterval: number,
    content?: string
}) {
    if (!await pinMessage(msg.channel, messageInterval, content))
        return "no_content";
}

const command: CommandDefinition = {
    key: "set",
    args: [{
        translationKey: "messageInterval",
        type: ApplicationCommandOptionType.Integer,
        minValue: 10,
        maxValue: 100
    }, {
        translationKey: "content",
        type: ApplicationCommandOptionType.String,
        required: false
    }],
    handler: setPinnedMessage
};
export default command;
