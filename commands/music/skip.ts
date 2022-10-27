import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/conditions";
import { runtimeGuildData } from "../../env";

async function skip(msg: CommandMessage<true>) {
    const { musicPlayer } = runtimeGuildData.getOrSetDefault(msg.guildId);
    if (!musicPlayer)
        return "nothing_is_playing";

    musicPlayer.skip();
}

const command: CommandDefinition = {
    key: "skip",
    handler: skip,
    alwaysReactOnSuccess: true,
    conditions: InVoiceWithBot
};
export default command;
