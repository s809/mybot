import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { client, commandFramework } from "../../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";

const embedLoc = commandFramework.translationChecker.checkTranslations({
    "title": true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("bot/invite")}.embeds`);

async function botInvite(msg: CommandRequest) {
    await msg.reply({
        embeds: [{
            title: embedLoc.title.getTranslation(msg),
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
