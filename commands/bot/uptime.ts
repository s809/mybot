import { defineCommand } from "@s809/noisecord";
import os from "os";
import { client } from "../../env";

function getUptimeArgs(diff: number) {
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return {
        days,
        hours,
        mins,
        seconds
    };
}

export default defineCommand({
    key: "uptime",

    translations: {
        embeds: {
            title: true,
            text: true,
            time_format: true
        }
    },

    handler: async (msg, { }, { embeds }) => {
        let bot = new Date(client.uptime!);
        let host = new Date(os.uptime() * 1000);

        await msg.replyOrEdit({
            embeds: [{
                title: embeds.title,
                description: embeds.text.withArgs({
                    botUptime: embeds.time_format.withArgs(getUptimeArgs(bot.getTime())),
                    hostUptime: embeds.time_format.withArgs(getUptimeArgs(host.getTime()))
                })
            }]
        });
    },
});
