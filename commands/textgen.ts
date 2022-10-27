import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { TextGenData } from "../database/models";
import { runtimeGuildData } from "../env";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { CommandDefinition } from "../modules/commands/definitions";

async function manageTextGen(msg: CommandMessage<true>, {
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

const command: CommandDefinition = {
    key: "textgen",
    args: [{
        translationKey: "action",
        type: ApplicationCommandOptionType.String,
        choices: [{
            translationKey: "enable",
            value: "enable"
        }, {
            translationKey: "disable",
            value: "disable"
        }]
    }],
    handler: manageTextGen,
    alwaysReactOnSuccess: true,
    usableAsAppCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false
};
export default command;
