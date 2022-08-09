import { CommandRequirement, InServer } from ".";

export const InVoiceChannel: CommandRequirement = {
    name: "In Voice Channel",
    check: msg => !!msg.member?.voice.channel,
    failureMessage: "You must be in a voice channel to use this command.",
    requires: [InServer]
};
