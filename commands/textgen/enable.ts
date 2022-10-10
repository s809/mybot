import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { getChannel } from "../../modules/data/databaseUtil";

async function enableTextGen(msg: CommandMessage<true>) {
    const item = (await getChannel(msg.channel, "textGenData"))!;

    if (item[1].textGenData)
        return "already_enabled";
    
    item[1].textGenData = {
        entrypoints: new Map(),
        words: new Map()
    };
    await item[0].save();
}

const command: CommandDefinition = {
    key: "enable",
    handler: enableTextGen,
    alwaysReactOnSuccess: true
};
export default command;
