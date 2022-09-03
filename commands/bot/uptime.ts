import os from "os";
import { client } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { PrefixedTranslator } from "../../modules/misc/Translator";

function getUptimeStr(diff: number, translator: PrefixedTranslator) {
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return translator.translate("embeds.time_format",
        days.toString(),
        hours.toString(),
        mins.toString(),
        seconds.toString());
}

async function uptime(msg: CommandMessage) {
    let bot = new Date(client.uptime!);
    let host = new Date(os.uptime() * 1000);

    await msg.reply({
        embeds: [{
            title: msg.translator.translate("embeds.title"),
            description: msg.translator.translate("embeds.text",
                getUptimeStr(bot.getTime(), msg.translator),
                getUptimeStr(host.getTime(), msg.translator))
        }]
    });
}

const command: CommandDefinition = {
    key: "uptime",
    handler: uptime,
};
export default command;
