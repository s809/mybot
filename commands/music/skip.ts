import { Message } from "discord.js";
import { musicPlayingGuilds } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { InVoiceWithBot } from "../../modules/commands/requirements";
import { Translator } from "../../modules/misc/Translator";

async function skip(msg: Message<true>) {
    let translator = Translator.getOrDefault(msg);

    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return translator.translate("errors.nothing_is_playing");

    player.skip();
}

const command: Command = {
    name: "skip",
    func: skip,
    alwaysReactOnSuccess: true,
    requirements: InVoiceWithBot
};
export default command;
