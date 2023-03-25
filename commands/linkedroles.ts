import { defineCommand } from "@s809/noisecord";
import { oauth2 } from "../constants";
import { commandFramework } from "../env";

const strings = commandFramework.translationChecker.checkTranslations({
    use_link: true,
    oauth2_not_enabled: true
}, `${commandFramework.commandRegistry.getCommandTranslationPath("linkedroles")}.strings`);

export default defineCommand({
    key: "linkedroles",
    allowDMs: false,
    handler: async req => {
        if (!oauth2)
            return strings.oauth2_not_enabled.path;
        
        await req.reply(strings.use_link.getTranslation(req, {
            link: `<${oauth2!.urlBase}/oauth2/linked-roles>`
        }));
    }
});
