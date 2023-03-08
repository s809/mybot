import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function resetChannel(msg: CommandRequest<true>) {
    if (msg.channel.isThread())
        return "thread_channel";

    let position = msg.channel.position;
    await Promise.all([
        msg.channel.clone().then(channel => {
            channel.setPosition(position)
        }),
        msg.channel.delete()
    ]);
}

export default defineCommand({
    key: "reset",
    handler: resetChannel
});
