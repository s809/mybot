import { client, runtimeGuildData } from "../env";

client.on("voiceStateUpdate", (oldState, newState) => {
    const voiceState = newState.guild.voiceStates.resolve(client.user!.id as any)!;
    const { musicPlayer } = runtimeGuildData.getOrSetDefault(voiceState.guild.id);
    if (!musicPlayer) return;

    if (newState.id === client.user!.id && !newState.channelId) {
        musicPlayer.resume();
        return;
    }

    const memberCount = voiceState.channel!.members.size;
    if (memberCount === 1)
        musicPlayer.pause();
    else if (memberCount === 2 && (!oldState.channelId || newState.channelId === voiceState.channelId))
        musicPlayer.resume();
});
