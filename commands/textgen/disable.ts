import { Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { hasFlag, resolveFlaggableItem, removeFlag } from "../../modules/data/flags";
import { FlagData, TextGenData } from "../../modules/data/models";
import { Translator } from "../../modules/misc/Translator";

async function disableTextGen(msg: Message) {
    const item = <FlagData & TextGenData>(await resolveFlaggableItem(msg, msg.channel.id))!.dataEntry;

    if (!hasFlag(item, "genText"))
        return Translator.getOrDefault(msg).translate("errors.already_disabled");
    
    removeFlag(item, "genText");
    delete item.genCounters;
    delete item.genData;
}

const command: Command = {
    name: "disable",
    func: disableTextGen,
    alwaysReactOnSuccess: true
};
export default command;
