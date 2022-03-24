import { Permissions } from "discord.js";
import { client } from "../../env.js";
import { Translator } from "../../modules/misc/Translator.js";

/**
 * 
 * @param {import("discord.js").Message} msg 
 */
async function botInvite(msg) {
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

export const name = "invite";
export const minArgs = 0;
export const maxArgs = 0;
export const func = botInvite;
