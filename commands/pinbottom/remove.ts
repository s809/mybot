import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { unpinMessage } from "../../modules/messages/pinBottom";

async function removePinnedMessage(msg: CommandMessage<true>) {
    if (!await unpinMessage(msg.channel))
        return "not_pinned";
}

const command: CommandDefinition = {
    key: "remove",
    handler: removePinnedMessage
};
export default command;
