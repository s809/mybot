import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild } from "../database/models";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "prefix",
    args: [{
        key: "prefix",
        type: ApplicationCommandOptionType.String,
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    allowDMs: false,

    handler: async (req, { prefix }) => {
        await Guild.updateByIdWithUpsert(req.guildId, { prefix });
    }
});
