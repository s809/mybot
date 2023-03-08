import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild, User } from "../database/models";
import { CommandRequest } from "@s809/noisecord";
import { defineCommand } from "@s809/noisecord";
import { commandFramework } from "../env";

async function lang(msg: CommandRequest, {
    language: newLang
}: {
    language: string;
}) {
    const localeString = Object.entries(commandFramework.translatorManager!.setLocaleRegexes).find(([, regexp]) => regexp.test(newLang))?.[0];
    if (!localeString)
        return "invalid_language";

    if (msg.inGuild()) {
        await Guild.updateByIdWithUpsert(msg.guildId, { language: localeString });
    } else {
        await User.updateByIdWithUpsert((msg as CommandRequest<false>).author.id, { language: localeString });
    }
}

export default defineCommand({
    key: "lang",
    args: [{
        key: "language",
        type: ApplicationCommandOptionType.String,
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    interactionCommand: true,
    handler: lang,
    allowDMs: true,
    alwaysReactOnSuccess: true,
});
