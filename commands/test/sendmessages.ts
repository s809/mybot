import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";

async function test(msg: CommandMessage) {
    await msg.deferReply();
    
    for (let i = 0; i < 10; i++)
        await msg.sendSeparate(`${i + 1}`);
}

const command: CommandDefinition = {
    key: "sendmessages",
    handler: test
};
export default command;
