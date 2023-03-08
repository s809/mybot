import { defineCommand, InVoiceChannel } from "@s809/noisecord";

export default defineCommand({
    key: "music",
    conditions: [InVoiceChannel],
    ownerOnly: true,
    allowDMs: false
});
