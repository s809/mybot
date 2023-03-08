import { PermissionFlagsBits } from "discord.js";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "channel",
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false,
    interactionCommand: true
});
