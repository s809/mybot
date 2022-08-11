import { Message, OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function botInvite(msg: Message) {
    await msg.channel.send({
        embeds: [{
            title: Translator.getOrDefault(msg)!.translate("embeds.bot_invite.title"),
            description: client.generateInvite({
                scopes: [OAuth2Scopes.Bot],
                permissions: Object.values(PermissionFlagsBits)
            })
        }]
    });
}

const command: Command = {
    name: "invite",
    func: botInvite,
};
export default command;
