import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild, User } from "../database/models";
import { CommandRequest } from "@s809/noisecord";
import { defineCommand } from "@s809/noisecord";
import { commandFramework } from "../env";

export default defineCommand({
    key: "lang",
    args: [{
        key: "language",
        type: ApplicationCommandOptionType.String,
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    allowDMs: true,

    translations: {
        errors: {
            invalid_language: true
        }
    },

    handler: async (req, { language: newLang }, { errors }) => {
        const localeString = Object.entries(commandFramework.translatorManager!.setLocaleRegexes).find(([, regexp]) => regexp.test(newLang))?.[0];
        if (!localeString)
            return errors.invalid_language;

        if (req.inGuild()) {
            await Guild.updateByIdWithUpsert(req.guildId, { language: localeString });
        } else {
            await User.updateByIdWithUpsert((req as CommandRequest<false>).author.id, { language: localeString });
        }
    }
});
