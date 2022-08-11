import { Message } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { hasFlag, resolveFlaggableItem, setFlag } from "../../modules/data/flags";
import { FlagData, TextGenData } from "../../modules/data/models";
import { Translator } from "../../modules/misc/Translator";

async function enableTextGen(msg: Message) {
    const item = <FlagData & TextGenData>(await resolveFlaggableItem(msg, msg.channel.id))!.dataEntry;

    if (hasFlag(item, "genText"))
        return Translator.getOrDefault(msg).translate("errors.already_enabled");
    
    setFlag(item, "genText");
    item.genCounters = {};
    item.genData = {};
}

const command: CommandDefinition = {
    name: "enable",
    func: enableTextGen,
    alwaysReactOnSuccess: true
};
export default command;
