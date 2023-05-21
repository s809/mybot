import { CommandRequest, defineCommand } from "@s809/noisecord";

async function test(msg: CommandRequest) {
    for (let i = 0; i < 10; i++)
        await msg.channel.send(`${i + 1}`);
}

export default defineCommand({
    key: "sendmessages",
    handler: test
});
