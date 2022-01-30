import os from "os";
import { client } from "../../env.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

function getUptimeStr(diff, language) {
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return getTranslation(language, "common", "uptime_inner", days, hours, mins, seconds);
}

async function uptime(msg) {
    let bot = new Date(client.uptime);
    let host = new Date(os.uptime() * 1000);

    let language = getLanguageByMessage(msg);
    await msg.channel.send(getTranslation(language, "common", "uptime",
        getUptimeStr(bot, language),
        getUptimeStr(host, language)
    ));
}

export const name = "uptime";
export const func = uptime;
