import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { InVoiceWithBot } from "@s809/noisecord";
import { runtimeGuildData } from "../../env";

async function pause(msg: CommandRequest<true>) {
    const { musicPlayer } = runtimeGuildData.getOrSetDefault(msg.guildId);
    if (!musicPlayer)
        return "nothing_is_playing";
    
    musicPlayer.pause();
}

export default defineCommand({
    key: "pause",
    handler: pause,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
});
