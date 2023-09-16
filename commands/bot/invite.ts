import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { client } from "../../env";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "invite",

    translations: {
        embeds: {
            title: true
        }
    },

    handler: async (msg, { }, { embeds }) => {
        await msg.replyOrEdit({
            embeds: [{
                title: embeds.title,
                description: client.generateInvite({
                    scopes: [
                        OAuth2Scopes.Bot,
                        OAuth2Scopes.ApplicationsCommands
                    ],
                    permissions: PermissionFlagsBits.Administrator
                })
            }]
        });
    },
});
