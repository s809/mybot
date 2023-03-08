/**
 * @file Command for starting playback.
 */
import { fetchVideoOrPlaylist } from "../../modules/music/youtubeDl";
import { MusicPlayer } from "../../modules/music/MusicPlayer";
import { ApplicationCommandOptionType } from "discord.js";
import { CommandDefinition, defineCommand } from "@s809/noisecord";
import { MusicPlayerQueueEntry } from "../../modules/music/MusicPlayerQueue";
import { CommandRequest } from "@s809/noisecord";
import { runtimeGuildData } from "../../env";

async function play(msg: CommandRequest<true>, {
    urlOrQuery,
    playlistStartPosition = 0
}: {
    urlOrQuery: string;
    playlistStartPosition?: number;
}) {
    let voiceChannel = msg.member!.voice.channel!;

    if (urlOrQuery?.match(/(\\|'|")/))
        return "invalid_url";

    const { musicPlayer } = runtimeGuildData.getOrSetDefault(voiceChannel.guildId);
    
    if (!urlOrQuery) {
        if (musicPlayer?.resume())
            return;
        else
            return "no_url_or_query";
    }

    let videos: MusicPlayerQueueEntry[] = (await fetchVideoOrPlaylist(urlOrQuery)).slice(playlistStartPosition);
    if (!videos.length)
        return "no_videos_added";

    if (musicPlayer) {
        musicPlayer.queue.push(...videos);
        musicPlayer.updateStatus(null);
        return;
    }

    new MusicPlayer(voiceChannel, videos, msg.translator.root!).runPlayer(msg.channel);
}

export default defineCommand({
    key: "play",
    args: [{
        key: "urlOrQuery",
        type: ApplicationCommandOptionType.String,
    }, {
        key: "playlistStartPosition",
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        maxValue: 99,
        required: false,
    }],
    handler: play
});
