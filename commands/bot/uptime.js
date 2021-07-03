"use strict";

import os from "os";
import { client } from "../../env.js";

function getUptimeStr(diff)
{
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return `${days} days, ${hours} hours, ${mins} minutes, ${seconds} seconds`;
}

async function uptime(msg) {
    let bot = new Date(client.uptime);
    let host = new Date(os.uptime() * 1000);

    await msg.channel.send(`Bot uptime: ${getUptimeStr(bot)}\nHost uptime: ${getUptimeStr(host)}`);
    return true;
}

export const name = "uptime";
export const description = "get bot uptime";
export const func = uptime;
