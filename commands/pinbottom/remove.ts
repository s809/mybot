import { CommandRequest, defineCommand } from "@s809/noisecord";
import { unpinMessage } from "../../modules/messages/pinBottom";

async function removePinnedMessage(msg: CommandRequest<true>) {
    if (!await unpinMessage(msg.channel))
        return "not_pinned";
}

export default defineCommand({
    key: "remove",
    handler: removePinnedMessage
});
