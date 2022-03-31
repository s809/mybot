import { Message } from "discord.js";
import os from "os";
import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

function getUptimeStr(diff: number, translator: Translator) {
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return translator.translate("embeds.bot_uptime.time_format",
        days.toString(),
        hours.toString(),
        mins.toString(),
        seconds.toString());
}

async function uptime(msg: Message) {
    let bot = new Date(client.uptime);
    let host = new Date(os.uptime() * 1000);

    let translator = Translator.get(msg);
    await msg.channel.send({
        embeds: [{
            title: translator.translate("embeds.bot_uptime.title"),
            description: translator.translate("embeds.bot_uptime.text",
                getUptimeStr(bot.getTime(), translator),
                getUptimeStr(host.getTime(), translator))
        }]
    });
}

const command: Command = {
    name: "uptime",
    func: uptime,
};
export default command;
