import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";

async function resetChannel(msg: CommandMessage<true>) {
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

const command: CommandDefinition = {
    key: "reset",
    handler: resetChannel
};
export default command;
