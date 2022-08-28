import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { client } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function botInvite(msg: CommandMessage) {
    await msg.reply({
        embeds: [{
            title: Translator.getOrDefault(msg)!.translate("embeds.bot_invite.title"),
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
