/**
 * @file Command for starting playback.
 */
import { musicPlayingGuilds } from "../../env";
import { fetchVideoOrPlaylist } from "../../modules/music/youtubeDl";
import { Translator } from "../../modules/misc/Translator";
import { MusicPlayer } from "../../modules/music/MusicPlayer";
import { GuildTextBasedChannel, Message } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { MusicPlayerQueueEntry } from "../../modules/music/MusicPlayerQueue";

async function play(msg: Message, url: string, startPositionStr: string) {
    let translator = Translator.getOrDefault(msg);

    if (url?.match(/(\\|'|")/))
        return translator.translate("errors.invalid_url");

    let voiceChannel = msg.member?.voice.channel;
    if (!voiceChannel)
        return translator.translate("errors.not_in_any_voice");

    let player = musicPlayingGuilds.get(voiceChannel.guild);
    
    if (!url) {
        if (player?.resume())
            return;
        else
            return translator.translate("errors.no_url");
    }
        

    let videos: MusicPlayerQueueEntry[] = await fetchVideoOrPlaylist(url);

    // Validate start time/position
    let startPosition: number;
    if (startPositionStr) {
        if (!startPositionStr.match(/^\d{1,2}$/) || parseInt(startPositionStr) < 1) {
            return translator.translate("errors.invalid_start_position");
        } else {
            startPosition = parseInt(startPositionStr);
            if (startPosition - 1 >= videos.length)
                return translator.translate("errors.no_videos_added");

            videos = videos.slice(startPosition - 1);
        }
    }

    if (player) {
        player.queue.push(...videos);
        player.updateStatus(null);
        return;
    }

    player = new MusicPlayer(voiceChannel, videos, translator);
    player.runPlayer(msg.channel as GuildTextBasedChannel);
}

const command: CommandDefinition = {
    name: "play",
    args: [0, 2, "[url|\"query\"] [startPos (0-99)]"],
    func: play
};
export default command;
