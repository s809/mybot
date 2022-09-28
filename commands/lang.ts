import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild, User } from "../database/models";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { CommandDefinition } from "../modules/commands/definitions";
import { Translator } from "../modules/misc/Translator";

async function lang(msg: CommandMessage, {
    language: newLang
}: {
    language: string;
}) {
    if (msg.member && !msg.member.permissions.has("ManageGuild"))
        return "cannot_manage_language";

    const localeString = [...Translator.translators.values()].find(x => x.setLanguageRegex.test(newLang))?.localeString;
    if (!localeString)
        return "invalid_language";

    if (msg.guildId)
        await Guild.findByIdOrDefaultAndUpdate(msg.guildId, { language: localeString });
    else
        await User.findByIdOrDefaultAndUpdate(msg.guildId, { language: localeString });
}

const command: CommandDefinition = {
    key: "lang",
    args: [{
        translationKey: "language",
        type: ApplicationCommandOptionType.String,
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    usableAsAppCommand: true,
    handler: lang,
    alwaysReactOnSuccess: true,
}
export default command;
