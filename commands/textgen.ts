import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { TextGenData } from "../database/models";
import { runtimeGuildData } from "../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "textgen",
    args: [{
        key: "action",
        type: ApplicationCommandOptionType.String,
        choices: [{
            key: "enable",
            value: "enable"
        }, {
            key: "disable",
            value: "disable"
        }]
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false,

    translations: {
        errors: {
            already_enabled: true,
            already_disabled: true,
        }
    },

    handler: async (msg: CommandRequest<true>, { action }, { errors }) => {
        const channelData = runtimeGuildData.get(msg.guildId)
            .channels.get(msg.channelId);

        if (action === "enable") {
            const result = await TextGenData.updateOne({ _id: msg.channelId }, {}, { upsert: true });
            if (!result.upsertedCount)
                return errors.already_enabled;

            channelData.textGenEnabled = true;
        } else {
            const result = await TextGenData.deleteOne({ _id: msg.channelId });
            if (!result.deletedCount)
                return errors.already_disabled;

            channelData.textGenEnabled = false;
        }
    },
});
