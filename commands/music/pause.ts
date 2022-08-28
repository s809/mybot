import { Message } from "discord.js";
import { musicPlayingGuilds } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/requirements";
import { Translator } from "../../modules/misc/Translator";

async function pause(msg: CommandMessage<true>) {
    let translator = Translator.getOrDefault(msg)!;

    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return translator.translate("errors.nothing_is_playing");
    
    player.pause();
}

const command: CommandDefinition = {
    key: "pause",
    handler: pause,
    alwaysReactOnSuccess: true,
    requirements: InVoiceWithBot
};
export default command;
