import { PermissionFlagsBits } from "discord.js";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "pinbottom",
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    allowDMs: false
});
