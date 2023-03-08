import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { TextGenData } from "../database/models";
import { runtimeGuildData } from "../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function manageTextGen(msg: CommandRequest<true>, {
    action
}: {
    action: "enable" | "disable"
}) {
    const channelData = runtimeGuildData.getOrSetDefault(msg.guildId)
        .channels.getOrSetDefault(msg.channelId);

    if (action === "enable") {
        const result = await TextGenData.updateOne({ _id: msg.channelId }, {}, { upsert: true });
        if (!result.upsertedCount)
            return "already_enabled";

        channelData.textGenEnabled = true;
    } else {
        const result = await TextGenData.deleteOne({ _id: msg.channelId });
        if (!result.deletedCount)
            return "already_disabled";

        channelData.textGenEnabled = false;
    }
}

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
    handler: manageTextGen,
    alwaysReactOnSuccess: true,
    interactionCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false
});
