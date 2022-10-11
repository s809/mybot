import { TextGenData } from "../../database/models";
import { textGenEnabledChannels } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";

async function enableTextGen(msg: CommandMessage<true>) {
    const result = await TextGenData.updateOne({ _id: msg.channelId }, {}, { upsert: true });
    if (!result.upsertedCount)
        return "already_enabled";

    textGenEnabledChannels.add(msg.channelId);
}

const command: CommandDefinition = {
    key: "enable",
    handler: enableTextGen,
    alwaysReactOnSuccess: true
};
export default command;
