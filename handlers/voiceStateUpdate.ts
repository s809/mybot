import { client, runtimeGuildData } from "../env";

client.on("voiceStateUpdate", (oldState, newState) => {
    const botVoiceState = newState.guild.members.me!.voice;

    const { musicPlayer } = runtimeGuildData.getOrSetDefault(botVoiceState.guild.id);
    if (!musicPlayer) return;

    const countMembers = () => botVoiceState.channel!.members.filter(member => !member.user.bot && !member.voice.deaf).size;

    if (newState.id === client.user!.id) {
        if (!botVoiceState.channelId) {
            // Kicked
            musicPlayer.resume();
            return;
        }
    } else {
        // Check if update is related to bot's channels
        if (![oldState.channelId, newState.channelId].includes(botVoiceState.channelId))
            return;
    }

    // Check if muted/everyone left
    if (botVoiceState.mute || !countMembers())
        musicPlayer.pause();
});
