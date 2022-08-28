import { ApplicationCommandOptionType, Message } from "discord.js";
import { data } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { TextGenData } from "../../modules/data/models";
import { Translator } from "../../modules/misc/Translator";

function calculateProperties(arr: number[], translator: Translator, name: string) {
    name = translator.translate(name);

    if (!arr.length)
        return translator.translate("embeds.textgen.property_table_not_enough_data", name);

    let avg = arr.reduce((acc, item) => acc + item, 0) / arr.length;
    arr = arr.sort((x: number, y: number) => x - y);
    let med = arr[Math.floor(arr.length / 2)];

    return translator.translate("embeds.textgen.property_table", name, avg.toString(), med.toString(), arr[0].toString(), arr[arr.length - 1].toString());
}

function getVariations(genData: TextGenData["genData"], depth: number, wordData: {}) {
    let result = 0;

    for (let word of Object.keys(wordData)) {
        if (word === "__genEnd")
            continue;

        if (depth === 1)
            result++;

        else
            result += getVariations(genData, depth - 1, genData![word]);
    }

    return result;
}

function calculatePropertiesForList(genData: TextGenData["genData"], branchCutoff: number, translator: Translator) {
    let result = "";

    let arr = Object.values(genData!).filter(wordData => Object.keys(wordData).length >= branchCutoff);

    let varr = arr.map(wordData => Object.values(wordData));
    let earr = arr.map(wordData => Object.entries(wordData));

    result += calculateProperties(varr.map(values => values.length), translator, "embeds.textgen.word_chain_variants");
    result += calculateProperties(varr.map(values => Math.max(...values)), translator, "embeds.textgen.most_common_next_word_probability");
    result += calculateProperties(earr
        .reduce<number[]>((acc, item) => {
            let pair = item.find(x => x[0] === "__genEnd");
            if (pair)
                acc.push(pair[1]);
            return acc;
        }, []), translator, "embeds.textgen.generation_stop_probability");

    return result;
}

async function textGenInfo(msg: CommandMessage<true>, {
    branchCutoff,
    branchCounterDepth
}: {
    branchCutoff: number;
    branchCounterDepth: number;
}) {
    const translator = Translator.getOrDefault(msg);
    
    let genData = data.guilds[msg.guildId].channels[msg.channelId].genData;
    let text = calculatePropertiesForList(genData, branchCutoff, translator);
    
    for (let i = 1; i <= branchCounterDepth; i++)
        text += `${i}: ${getVariations(genData, i, genData!)}\n`;
    
    await msg.reply(text);
}

const command: CommandDefinition = {
    key: "info",
    handler: textGenInfo,
    args: [{
        translationKey: "branchCutoff",
        type: ApplicationCommandOptionType.Integer,
    }, {
        translationKey: "branchCounterDepth",
        type: ApplicationCommandOptionType.Integer,
        maxValue: 5,
    }]
};
export default command;
