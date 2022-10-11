import { TextGenData } from "../../database/models";
import { textGenEnabledChannels } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";

async function disableTextGen(msg: CommandMessage<true>) {
    const result = await TextGenData.deleteOne({ _id: msg.channelId });
    if (!result.deletedCount)
        return "already_disabled";
    
    textGenEnabledChannels.delete(msg.channelId);
}

const command: CommandDefinition = {
    key: "disable",
    handler: disableTextGen,
    alwaysReactOnSuccess: true
};
export default command;
