import { client, musicPlayingGuilds } from "../env.js";

client.on("voiceStateUpdate", (oldState, newState) => {
    let voiceState = newState.guild.voiceStates.resolve(client.user.id);
    let player = musicPlayingGuilds.get(voiceState?.guild)?.player;

    if (!player) return;
    if (newState.id === client.user.id && !newState.channelId) {
        player.unpause();
        return;
    }

    let memberCount = voiceState.channel.members.size;
    if (memberCount === 1)
        player.pause();
    else if (memberCount === 2 && (!oldState.channelId || newState.channelId === voiceState.channelId))
        player.unpause();
});
