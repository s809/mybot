import { Message } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { hasFlag, resolveFlaggableItem, setFlag } from "../../modules/data/flags";
import { FlaggableDataEntry } from "../../modules/data/models";
import { Translator } from "../../modules/misc/Translator";

async function enableTextGen(msg: Message) {
    const item = (await resolveFlaggableItem(msg, msg.channel.id)).dataEntry as FlaggableDataEntry & {
        genCounters: any;
        genData: any;
    };

    if (hasFlag(item, "genText"))
        return Translator.get(msg).translate("errors.already_enabled");
    
    setFlag(item, "genText");
    item.genCounters = {};
    item.genData = {};
}

const command: Command = {
    name: "enable",
    func: enableTextGen
};
export default command;
