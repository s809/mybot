/**
 * @file Command for starting playback.
 */
import { musicPlayingGuilds } from "../../env";
import { fetchVideoOrPlaylist } from "../../modules/music/youtubeDl";
import { Translator } from "../../modules/misc/Translator";
import { MusicPlayer } from "../../modules/music/MusicPlayer";
import { ApplicationCommandOptionType, GuildTextBasedChannel } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { MusicPlayerQueueEntry } from "../../modules/music/MusicPlayerQueue";
import { CommandMessage } from "../../modules/commands/CommandMessage";

async function play(msg: CommandMessage, {
    urlOrQuery,
    playlistStartPosition = 0
}: {
    urlOrQuery: string;
    playlistStartPosition?: number;
}) {
    let voiceChannel = msg.member!.voice.channel!;

    if (urlOrQuery?.match(/(\\|'|")/))
        return "invalid_url";

    let player = musicPlayingGuilds.get(voiceChannel.guild);
    
    if (!urlOrQuery) {
        if (player?.resume())
            return;
        else
            return "no_url_or_query";
    }

    let videos: MusicPlayerQueueEntry[] = (await fetchVideoOrPlaylist(urlOrQuery)).slice(playlistStartPosition);
    if (!videos.length)
        return "no_videos_added";

    if (player) {
        player.queue.push(...videos);
        player.updateStatus(null);
        return;
    }

    player = new MusicPlayer(voiceChannel, videos, msg.translator.translator);
    player.runPlayer(msg.channel as GuildTextBasedChannel);
}

const command: CommandDefinition = {
    key: "play",
    args: [{
        translationKey: "urlOrQuery",
        type: ApplicationCommandOptionType.String,
    }, {
        translationKey: "playlistStartPosition",
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        maxValue: 99,
        required: false,
    }],
    handler: play
};
export default command;
