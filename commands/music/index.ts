import { BuiltInCommandConditions, defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "music",
    conditions: [BuiltInCommandConditions.InVoiceChannel],
    ownerOnly: true,
    allowDMs: false
});
