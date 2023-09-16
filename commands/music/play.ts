/**
 * @file Command for starting playback.
 */
import { defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType } from "discord.js";
import { runtimeGuildData } from "../../env";
import { MusicPlayer } from "../../modules/music/MusicPlayer";
import { MusicPlayerQueueEntry } from "../../modules/music/MusicPlayerQueue";
import { fetchVideoOrPlaylist } from "../../modules/music/youtubeDl";

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
    allowDMs: false,

    translations: {
        errors: {
            invalid_url: true,
            no_url_or_query: true,
            no_videos_added: true
        }
    },

    handler: async (req, {
        urlOrQuery,
        playlistStartPosition = 0
    }, { errors }) => {
        let voiceChannel = req.member!.voice.channel!;

        if (urlOrQuery?.match(/(\\|'|")/))
            return errors.invalid_url;

        const { musicPlayer } = runtimeGuildData.get(voiceChannel.guildId);

        if (!urlOrQuery) {
            if (musicPlayer?.resume())
                return;
            else
                return errors.no_url_or_query;
        }

        let videos: MusicPlayerQueueEntry[] = (await fetchVideoOrPlaylist(urlOrQuery)).slice(playlistStartPosition);
        if (!videos.length)
            return errors.no_videos_added;

        if (musicPlayer) {
            musicPlayer.queue.push(...videos);
            musicPlayer.updateStatus(null);
            return;
        }

        new MusicPlayer(voiceChannel, videos, req.translator.root!).runPlayer(req.channel);
    }
});
