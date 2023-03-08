import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { client } from "../../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function botInvite(msg: CommandRequest) {
    await msg.reply({
        embeds: [{
            title: msg.translator.translate("embeds.title"),
            description: client.generateInvite({
                scopes: [
                    OAuth2Scopes.Bot,
                    OAuth2Scopes.ApplicationsCommands
                ],
                permissions: PermissionFlagsBits.Administrator
            })
        }]
    });
}

export default defineCommand({
    key: "invite",
    handler: botInvite,
});
