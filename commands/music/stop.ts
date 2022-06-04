import { Message } from "discord.js";
import { musicPlayingGuilds } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function stop(msg: Message) {
    let translator = Translator.get(msg);

    if (!msg.member?.voice.channel)
        return translator.translate("errors.not_in_any_voice");

    if (msg.member.voice.channelId !== msg.guild.members.me.voice.channelId)
        return translator.translate("errors.not_in_specific_voice", msg.guild.members.me.voice.channel.toString());

    let player = musicPlayingGuilds.get(msg.guild);
    if (!player)
        return translator.translate("errors.nothing_is_playing");

    player.stop();
}

const command: Command = {
    name: "stop",
    func: stop
};
export default command;
