import { BuiltInCommandConditions, CommandRequest, defineCommand } from "@s809/noisecord";
import { runtimeGuildData } from "../../env";

export default defineCommand({
    key: "pause",
    conditions: BuiltInCommandConditions.InVoiceWithBot,

    translations: {
        errors: {
            nothing_is_playing: true
        }
    },

    handler: (msg: CommandRequest<true>, { }, { errors }) => {
        const { musicPlayer } = runtimeGuildData.get(msg.guildId);
        if (!musicPlayer)
            return errors.nothing_is_playing;

        musicPlayer.pause();
    }
});
