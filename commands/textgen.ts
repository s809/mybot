import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { TextGenData } from "../database/models";
import { commandFramework, runtimeGuildData } from "../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    already_enabled: true,
    already_disabled: true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("textgen")}.errors`);

async function manageTextGen(msg: CommandRequest<true>, {
    action
}: {
    action: "enable" | "disable"
}) {
    const channelData = runtimeGuildData.get(msg.guildId)
        .channels.get(msg.channelId);

    if (action === "enable") {
        const result = await TextGenData.updateOne({ _id: msg.channelId }, {}, { upsert: true });
        if (!result.upsertedCount)
            return errorLoc.already_enabled.path;

        channelData.textGenEnabled = true;
    } else {
        const result = await TextGenData.deleteOne({ _id: msg.channelId });
        if (!result.deletedCount)
            return errorLoc.already_disabled.path;

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
        defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    allowDMs: false
});
