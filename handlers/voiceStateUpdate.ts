import { client, runtimeGuildData } from "../env";

client.on("voiceStateUpdate", (oldState, newState) => {
    const botVoiceState = newState.guild.members.me?.voice!;
    if (![oldState.channelId, newState.channelId].includes(botVoiceState.channelId))
        return;

    const { musicPlayer } = runtimeGuildData.getOrSetDefault(newState.guild.id);
    if (!musicPlayer) return;

    // Muted/unmuted
    if (newState.channelId === oldState.channelId) {
        // Don't care about other users (un)muting each other
        if (newState.id !== client.user!.id) return;

        if (newState.channel?.members.size! > 1 && !newState.mute)
            musicPlayer.resume();
        else
            musicPlayer.pause();
        
        return;
    } else if (!botVoiceState.mute) { // Moved/kicked
        // Behavior is exactly same for both bot and other users

        if (newState.channel?.members.size! > 1 || (!newState.channel && newState.id === client.user!.id))
            musicPlayer.resume();
        else
            musicPlayer.pause();
    }
});
