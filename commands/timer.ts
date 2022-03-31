import { Message } from "discord.js";
import { setTimeout } from "timers/promises";
import { Command } from "../modules/commands/definitions";
import { Translator } from "../modules/misc/Translator";

async function timer(msg: Message, date: string, time: string, countstr: string, endstr: string) {
    let translator = Translator.get(msg);
    
    let splitDate: (string | number)[] = date.split(".");
    for (let i = 0; i < splitDate.length; i++) {
        splitDate[i] = parseInt(splitDate[i] as string);
        if (splitDate[i] === undefined || splitDate.length !== 3)
            return translator.translate("errors.invalid_date_format");
    }

    let splitTime: (string | number)[] = time.split(":");
    for (let i = 0; i < splitTime.length; i++) {
        splitTime[i] = parseInt(splitTime[i] as string);
        if (splitTime[i] === undefined || splitTime.length !== 2)
            return translator.translate("errors.invalid_time_format");
    }

    if (!countstr)
        return translator.translate("errors.countstr_empty");
    if (!endstr)
        return translator.translate("errors.endstr_empty");

    let goal = new Date(
        splitDate[2] as number,
        splitDate[1] as number - 1,
        splitDate[0] as number,
        splitTime[0] as number,
        splitTime[1] as number);
    let current;

    let res = await msg.channel.send(translator.translate("common.initializing_timer"));

    do {
        let diff = new Date(goal.getTime() - Date.now() + 60000);

        await res.edit(countstr.replace("%s", `${diff.getUTCHours().toString().padStart(2, "0")}:${diff.getUTCMinutes().toString().padStart(2, "0")}`));
        await setTimeout(60000 - Date.now() % 60000);

        current = new Date(Date.now());
    }
    while (goal > current);

    await res.edit(endstr);
}

const command: Command = {
    name: "timer",
    args: [4, 4, "<dd.mm.yyyy> <hh:mm> <countstr{%s}> <endstr>"],
    func: timer,
    managementPermissionLevel: "BOT_OWNER"
}
export default command;
