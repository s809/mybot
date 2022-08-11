import { Message } from "discord.js";
import { musicPlayingGuilds } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/requirements";
import { Translator } from "../../modules/misc/Translator";

async function stop(msg: Message<true>) {
    let translator = Translator.getOrDefault(msg);

    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return translator.translate("errors.nothing_is_playing");

    player.stop();
}

const command: Command = {
    name: "stop",
    func: stop,
    requirements: InVoiceWithBot
};
export default command;
