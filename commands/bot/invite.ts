import { Message, Permissions } from "discord.js";
import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function botInvite(msg: Message) {
    await msg.channel.send({
        embeds: [{
            title: Translator.get(msg).translate("embeds.bot_invite.title"),
            description: client.generateInvite({
                scopes: ["bot"],
                permissions: Permissions.ALL
            })
        }]
    });
}

const command: Command = {
    name: "invite",
    func: botInvite,
};
export default command;
