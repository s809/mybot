import { PermissionFlagsBits } from "discord.js";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "bot",
    interactionCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.UseApplicationCommands
});
