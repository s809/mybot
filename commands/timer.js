"use strict";

import { sleep } from "../util.js";

async function timer(msg, date, time, countstr, endstr) {
    date = date.split(".");
    for (let i = 0; i < date.length; i++) {
        date[i] = parseInt(date[i]);
        if (date[i] === undefined || date.length !== 3) {
            msg.channel.send("Invalid date format");
            return false;
        }
    }

    time = time.split(":");
    for (let i = 0; i < time.length; i++) {
        time[i] = parseInt(time[i]);
        if (time[i] === undefined || time.length !== 2) {
            msg.channel.send("Invalid time format");
            return false;
        }
    }

    if (!countstr) {
        msg.channel.send("Countstr is empty.");
        return;
    }

    if (!endstr) {
        msg.channel.send("Endstr is empty.");
        return;
    }

    let goal = new Date(date[2], date[1] - 1, date[0], time[0], time[1]);
    let current;

    let res = await msg.channel.send("Initializing timer...");

    do {
        let diff = new Date(goal - Date.now() + 60000);

        await res.edit(countstr.replace("%s", `${diff.getUTCHours().toString().padStart(2, "0")}:${diff.getUTCMinutes().toString().padStart(2, "0")}`));
        await sleep(60000 - Date.now() % 60000);

        current = new Date(Date.now());
    }
    while (goal > current);

    await res.edit(endstr);
    return true;
}

export const name = "timer";
export const description = "self-updating UTC timer message";
export const args = "<dd.mm.yyyy> <hh:mm> <countstr{%s}> <endstr>";
export const minArgs = 4;
export const maxArgs = 4;
export const func = timer;
