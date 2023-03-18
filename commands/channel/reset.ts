import { CommandRequest, defineCommand } from "@s809/noisecord";
import { commandFramework } from "../../env";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    thread_channel: true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("channel/reset")}.errors`);

async function resetChannel(msg: CommandRequest<true>) {
    if (msg.channel.isThread())
        return errorLoc.thread_channel.path;

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
