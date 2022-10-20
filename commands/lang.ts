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
    const localeString = [...Translator.translators.values()].find(x => x.setLanguageRegex.test(newLang))?.localeString;
    if (!localeString)
        return "invalid_language";

    if (msg.inGuild() && !msg.interaction) {
        if (!msg.member.permissions.has("ManageGuild"))
            return "cannot_manage_language";

        await Guild.updateByIdWithUpsert(msg.guildId, { language: localeString });
    } else {
        await User.updateByIdWithUpsert(msg.author.id, { language: localeString });
    }
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
