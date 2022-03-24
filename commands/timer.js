import { setTimeout } from "timers/promises";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";
import { Translator } from "../modules/misc/Translator.js";

async function timer(msg, date, time, countstr, endstr) {
    let translator = Translator.get(msg);

    date = date.split(".");
    for (let i = 0; i < date.length; i++) {
        date[i] = parseInt(date[i]);
        if (date[i] === undefined || date.length !== 3)
            return translator.translate("errors.invalid_date_format");
    }

    time = time.split(":");
    for (let i = 0; i < time.length; i++) {
        time[i] = parseInt(time[i]);
        if (time[i] === undefined || time.length !== 2)
            return translator.translate("errors.invalid_time_format");
    }

    if (!countstr)
        return translator.translate("errors.countstr_empty");
    if (!endstr)
        return translator.translate("errors.endstr_empty");

    let goal = new Date(date[2], date[1] - 1, date[0], time[0], time[1]);
    let current;

    let res = await msg.channel.send(translator.translate("common.initializing_timer"));

    do {
        let diff = new Date(goal - Date.now() + 60000);

        await res.edit(countstr.replace("%s", `${diff.getUTCHours().toString().padStart(2, "0")}:${diff.getUTCMinutes().toString().padStart(2, "0")}`));
        await setTimeout(60000 - Date.now() % 60000);

        current = new Date(Date.now());
    }
    while (goal > current);

    await res.edit(endstr);
}

export const name = "timer";
export const args = "<dd.mm.yyyy> <hh:mm> <countstr{%s}> <endstr>";
export const minArgs = 4;
export const maxArgs = 4;
export const func = timer;
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
