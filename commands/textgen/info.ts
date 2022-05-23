import { Message } from "discord.js";
import { data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { Translator } from "../../modules/misc/Translator";

async function textGenInfo(msg: Message, branchCutoffStr: string, branchCounterDepthStr: string) {
    let branchCutoff = parseInt(branchCutoffStr);
    let branchCounterDepth = parseInt(branchCounterDepthStr);
    const translator = Translator.get(msg);

    if (branchCounterDepth > 5)
        return translator.translate("errors.argument_value_too_large", "branch counter depth", "5");

    const getVariations = (genData: { [x: string]: any; }, depth: number, wordData: {}) => {
        let result = 0;
    
        for (let word of Object.keys(wordData)) {
            if (word === "__genEnd") continue;
    
            if (depth === 1)
                result++;
            else
                result += getVariations(genData, depth - 1, genData[word]);
        }
    
        return result;
    };
    
    const calculateProperties = (arr: any[], name: string) => {
        if (!arr.length)
            return translator.translate("embeds.textgen.property_table_not_enough_data", name);

        let avg = arr.reduce((acc: any, item: any) => acc + item, 0) / arr.length;
        arr = arr.sort((x: number, y: number) => x - y);
        let med = arr[Math.floor(arr.length / 2)];

        return translator.translate("embeds.textgen.property_table", name, avg.toString(), med, arr[0], arr[arr.length - 1]);
    };
    
    const calculatePropertiesForList = (genData: { [s: string]: unknown; } | ArrayLike<unknown>) => {
        let result = "";
    
        let arr = Object.values(genData).filter(wordData => Object.keys(wordData).length >= branchCutoff);
            
        let varr = arr.map(wordData => Object.values(wordData));
        let earr = arr.map(wordData => Object.entries(wordData));
    
        result += calculateProperties(varr.map(values => values.length), translator.translate("embeds.textgen.word_chain_variants"));
        result += calculateProperties(varr.map(values => Math.max(...values)), translator.translate("embeds.textgen.most_common_next_word_probability"));
        result += calculateProperties(earr
            .reduce((acc, item) => {
                let pair = item.find(x => x[0] === "__genEnd");
                if (pair)
                    acc.push(pair[1]);
                return acc;
            }, []), translator.translate("embeds.textgen.generation_stop_probability"));
    
        return result;
    };
    
    let genData = data.guilds[msg.guildId].channels[msg.channelId].genData;
    let text = calculatePropertiesForList(genData);
    
    for (let i = 1; i <= branchCounterDepth; i++)
        text += `${i}: ${getVariations(genData, i, genData)}\n`;
    
    await msg.channel.send(text);
}

const command: Command = {
    name: "info",
    func: textGenInfo,
    args: [2, 2, "<branch cutoff> <branch counter depth>"]
};
export default command;
