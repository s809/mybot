/**
 * @file Command for starting playback.
 */
import { fetchVideoOrPlaylist } from "../../modules/music/youtubeDl";
import { MusicPlayer } from "../../modules/music/MusicPlayer";
import { ApplicationCommandOptionType } from "discord.js";
import { defineCommand } from "@s809/noisecord";
import { MusicPlayerQueueEntry } from "../../modules/music/MusicPlayerQueue";
import { CommandRequest } from "@s809/noisecord";
import { commandFramework, runtimeGuildData } from "../../env";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    invalid_url: true,
    no_url_or_query: true,
    no_videos_added: true
}, `${commandFramework.commandRegistry.getCommandTranslationPath("music/play")}.errors`);

async function play(msg: CommandRequest<true>, {
    urlOrQuery,
    playlistStartPosition = 0
}: {
    urlOrQuery: string;
    playlistStartPosition?: number;
}) {
    let voiceChannel = msg.member!.voice.channel!;

    if (urlOrQuery?.match(/(\\|'|")/))
        return errorLoc.invalid_url.path;

    const { musicPlayer } = runtimeGuildData.get(voiceChannel.guildId);
    
    if (!urlOrQuery) {
        if (musicPlayer?.resume())
            return;
        else
            return errorLoc.no_url_or_query.path;
    }

    let videos: MusicPlayerQueueEntry[] = (await fetchVideoOrPlaylist(urlOrQuery)).slice(playlistStartPosition);
    if (!videos.length)
        return errorLoc.no_videos_added.path;

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
        required: false
    }, {
        key: "playlistStartPosition",
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        maxValue: 99,
        required: false,
    }],
    handler: play
});
