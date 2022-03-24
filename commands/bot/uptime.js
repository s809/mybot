import os from "os";
import { client } from "../../env.js";
import { Translator } from "../../modules/misc/Translator.js";

/**
 * @param {number} diff
 * @param {Translator} translator
 * @returns 
 */
function getUptimeStr(diff, translator) {
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return translator.translate("embeds.bot_uptime.time_format", days, hours, mins, seconds);
}

/**
 * @param {import("discord.js").Message} msg 
 */
async function uptime(msg) {
    let bot = new Date(client.uptime);
    let host = new Date(os.uptime() * 1000);

    let translator = Translator.get(msg);
    await msg.channel.send({
        embeds: [{
            title: translator.translate("embeds.bot_uptime.title"),
            description: translator.translate("embeds.bot_uptime.text",
                getUptimeStr(bot, translator),
                getUptimeStr(host, translator))
        }]
    });
}

export const name = "uptime";
export const func = uptime;
