import { Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { hasFlag, resolveFlaggableItem, removeFlag } from "../../modules/data/flags";
import { FlaggableDataEntry } from "../../modules/data/models";
import { Translator } from "../../modules/misc/Translator";

async function disableTextGen(msg: Message) {
    const item = (await resolveFlaggableItem(msg, msg.channel.id)).dataEntry as FlaggableDataEntry & {
        genCounters: any;
        genData: any;
    };

    if (!hasFlag(item, "genText"))
        return Translator.get(msg).translate("errors.already_disabled");
    
    removeFlag(item, "genText");
    delete item.genCounters;
    delete item.genData;
}

const command: Command = {
    name: "disable",
    func: disableTextGen
};
export default command;
