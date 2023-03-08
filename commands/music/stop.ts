import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { InVoiceWithBot } from "@s809/noisecord";
import { runtimeGuildData } from "../../env";

async function stop(msg: CommandRequest<true>) {
    const { musicPlayer } = runtimeGuildData.getOrSetDefault(msg.guildId);
    if (!musicPlayer)
        return "nothing_is_playing";

    musicPlayer.stop();
}

export default defineCommand({
    key: "stop",
    handler: stop,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
});
