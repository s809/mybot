import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function test(msg: CommandRequest) {
    await msg.deferReply();
    
    for (let i = 0; i < 10; i++)
        await msg.sendSeparate(`${i + 1}`);
}

export default defineCommand({
    key: "sendmessages",
    handler: test
});
