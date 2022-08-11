import assert from "assert";
import { Message } from "discord.js";
import { client, data } from "../../env";
import { TextGenData } from "../data/models";

export function generateSingleSample(genData: Exclude<TextGenData["genData"], undefined>, maxWords = 30) {
    let words = Object.getOwnPropertyNames(genData);
    let nextWord = words[Math.floor(Math.random() * words.length)];
    let result = nextWord;

    let wordData = genData[nextWord];
    for (let i = 0; i < maxWords; i++) {
        let chosenCumulativeProbability = Math.random();
        let nextWord: string | undefined;

        let words = Object.getOwnPropertyNames(wordData);
        
        for (let word of words) {
            chosenCumulativeProbability -= wordData[word];
            if (chosenCumulativeProbability <= 0) {
                nextWord = word;
                break;
            }
        }
        // Word must be chosen before reaching this point
        assert(chosenCumulativeProbability <= 0);

        if (nextWord === "__genEnd")
            break; // Finished generating text
        
        result += " " + nextWord;
        wordData = genData[nextWord!];
    }

    return result;
};

export function generate(msg: Message<true>, samples = 10) {
    let genData = data.guilds[msg.guildId].channels[msg.channelId].genData;
    if (!genData)
        throw new Error("No gen data found");

    let text = "";
    for (let i = 0; i < samples; i++) {
        let newText = generateSingleSample(genData);
        if (newText.length > text.length)
            text = newText;
    }
    return text;
}

export function shouldGenerate(msg: Message<true>, randomProbability = 1 / 50) {
    const isMention = msg.mentions.has(client.user!);
    const isReply = msg.reference?.messageId
        && msg.channel.messages.resolve(msg.reference.messageId)?.author.id === client.user!.id;
    const isRandom = Math.random() < randomProbability;

    return isRandom || isReply || isMention;
};

export function collectWordsFromMessage(msg: Message<true>, channelData: TextGenData, maxWordLength = 30) {
    let words = msg.content.split(/\s+/g).filter(word => word.length && word.length <= maxWordLength);
    words.push("__genEnd");

    for (let i = 0; i < words.length - 1; i++) {
        let word = words[i];
        let nextWord = words[i + 1];
        let genCounters = channelData.genCounters!;
        genCounters[word] ??= 0;

        if (typeof genCounters[word] !== "number")
            continue;

        channelData.genData![word] ??= {};
        let wordData = channelData.genData![word];

        if (nextWord === "__genEnd" && Object.getOwnPropertyNames(wordData).includes("__genEnd"))
            continue;

        wordData[nextWord] ??= 0;

        for (let w of Object.getOwnPropertyNames(wordData)) {
            let count = wordData[w] * genCounters[word];
            if (w === nextWord)
                count++;
            wordData[w] = count / (genCounters[word] + 1);
        }
        genCounters[word]++;
    }
}
