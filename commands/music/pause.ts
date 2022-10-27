import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/conditions";
import { runtimeGuildData } from "../../env";

async function pause(msg: CommandMessage<true>) {
    const { musicPlayer } = runtimeGuildData.getOrSetDefault(msg.guildId);
    if (!musicPlayer)
        return "nothing_is_playing";
    
    musicPlayer.pause();
}

const command: CommandDefinition = {
    key: "pause",
    handler: pause,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
};
export default command;
