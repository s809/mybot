import { defineCommand } from "@s809/noisecord";
import { oauth2 } from "../constants";

export default defineCommand({
    key: "linkedroles",
    allowDMs: false,

    translations: {
        strings: {
            use_link: true,
            oauth2_not_enabled: true
        }
    },

    handler: async (req, { }, { strings }) => {
        if (!oauth2)
            return strings.oauth2_not_enabled;

        await req.replyOrEdit(strings.use_link.withArgs({
            link: `<${oauth2!.urlBase}/oauth2/linked-roles>`
        }));
    }
});
