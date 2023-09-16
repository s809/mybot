import { CommandRequest, defineCommand } from "@s809/noisecord";
import { unpinMessage } from "../../modules/messages/pinBottom";

export default defineCommand({
    key: "remove",

    translations: {
        errors: {
            not_pinned: true
        }
    },

    handler: async (msg: CommandRequest<true>, { }, { errors }) => {
        if (!await unpinMessage(msg.channel))
            return errors.not_pinned;
    }
});
