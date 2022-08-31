import { Message } from "discord.js";
import { musicPlayingGuilds } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/conditions";
import { Translator } from "../../modules/misc/Translator";

async function stop(msg: CommandMessage<true>) {
    let translator = Translator.getOrDefault(msg);

    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return translator.translate("errors.nothing_is_playing");

    player.stop();
}

const command: CommandDefinition = {
    key: "stop",
    handler: stop,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
};
export default command;
