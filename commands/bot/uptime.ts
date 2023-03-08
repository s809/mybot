import os from "os";
import { client } from "../../env";
import { CommandRequest, defineCommand, Translator } from "@s809/noisecord";

function getUptimeStr(diff: number, translator: Translator) {
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return translator.translate("embeds.time_format", {
        days,
        hours,
        mins,
        seconds
    });
}

async function uptime(msg: CommandRequest) {
    let bot = new Date(client.uptime!);
    let host = new Date(os.uptime() * 1000);

    await msg.reply({
        embeds: [{
            title: msg.translator.translate("embeds.title"),
            description: msg.translator.translate("embeds.text", {
                botUptime: getUptimeStr(bot.getTime(), msg.translator),
                hostUptime: getUptimeStr(host.getTime(), msg.translator)
            })
        }]
    });
}

export default defineCommand({
    key: "uptime",
    handler: uptime,
});
