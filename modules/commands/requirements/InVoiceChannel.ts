import { CommandRequirement, InServer } from ".";

export const InVoiceChannel: CommandRequirement = {
    name: "In Voice Channel",
    check: msg => !!msg.member!.voice.channelId,
    failureMessage: "You must be in a voice channel to use this command.",
    hideInDescription: true,
    requires: InServer
};
