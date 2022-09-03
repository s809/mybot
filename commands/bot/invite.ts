import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { client } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";

async function botInvite(msg: CommandMessage) {
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

const command: CommandDefinition = {
    key: "invite",
    handler: botInvite,
};
export default command;
