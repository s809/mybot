import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { InVoiceWithBot } from "@s809/noisecord";
import { runtimeGuildData } from "../../env";

async function skip(msg: CommandRequest<true>) {
    const { musicPlayer } = runtimeGuildData.getOrSetDefault(msg.guildId);
    if (!musicPlayer)
        return "nothing_is_playing";

    musicPlayer.skip();
}

export default defineCommand({
    key: "skip",
    handler: skip,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
});
