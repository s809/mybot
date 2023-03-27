import { CommandRequest, defineCommand } from "@s809/noisecord";
import { InVoiceWithBot } from "@s809/noisecord";
import { commandFramework, runtimeGuildData } from "../../env";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    nothing_is_playing: true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("music/pause")}.errors`);

async function pause(msg: CommandRequest<true>) {
    const { musicPlayer } = runtimeGuildData.get(msg.guildId);
    if (!musicPlayer)
        return errorLoc.nothing_is_playing.path;
    
    musicPlayer.pause();
}

export default defineCommand({
    key: "pause",
    handler: pause,
        conditions: InVoiceWithBot
});
