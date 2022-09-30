import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { getChannel } from "../../modules/data/databaseUtil";

async function disableTextGen(msg: CommandMessage<true>) {
    const item = (await getChannel(msg.channel))!;

    if (!item[1].textGenData)
        return "already_disabled";
    
    item[1].textGenData = undefined;
    await item[0].save();
}

const command: CommandDefinition = {
    key: "disable",
    handler: disableTextGen,
    alwaysReactOnSuccess: true
};
export default command;
