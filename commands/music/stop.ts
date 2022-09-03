import { musicPlayingGuilds } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/conditions";

async function stop(msg: CommandMessage<true>) {
    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return "nothing_is_playing";

    player.stop();
}

const command: CommandDefinition = {
    key: "stop",
    handler: stop,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
};
export default command;
