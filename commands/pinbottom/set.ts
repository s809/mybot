import { CommandRequest, defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType } from "discord.js";
import { pinMessage } from "../../modules/messages/pinBottom";

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

    translations: {
        errors: {
            no_content: true
        }
    },

    handler: async (msg: CommandRequest<true>, {
        messageInterval,
        content
    }, { errors }) => {
        if (!await pinMessage(msg.channel, messageInterval, content))
            return errors.no_content;
    }
});
