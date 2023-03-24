import { CommandRequest, defineCommand } from "@s809/noisecord";
import { InVoiceWithBot } from "@s809/noisecord";
import { commandFramework, runtimeGuildData } from "../../env";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    nothing_is_playing: true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("music/skip")}.errors`);

async function skip(msg: CommandRequest<true>) {
    const { musicPlayer } = runtimeGuildData.getOrSetDefault(msg.guildId);
    if (!musicPlayer)
        return errorLoc.nothing_is_playing.path;

    musicPlayer.skip();
}

export default defineCommand({
    key: "skip",
    handler: skip,
        conditions: InVoiceWithBot
});
