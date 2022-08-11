import { Message } from "discord.js";
import { musicPlayingGuilds } from "../../env";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/requirements";
import { Translator } from "../../modules/misc/Translator";

async function stop(msg: Message<true>) {
    let translator = Translator.getOrDefault(msg);

    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return translator.translate("errors.nothing_is_playing");

    player.stop();
}

const command: CommandDefinition = {
    name: "stop",
    func: stop,
    alwaysReactOnSuccess: true,
    requirements: InVoiceWithBot
};
export default command;
