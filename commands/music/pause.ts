import { musicPlayingGuilds } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/conditions";

async function pause(msg: CommandMessage<true>) {
    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return "nothing_is_playing";
    
    player.pause();
}

const command: CommandDefinition = {
    key: "pause",
    handler: pause,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
};
export default command;
