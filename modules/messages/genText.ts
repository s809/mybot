import { Message } from "discord.js";
import { client, data } from "../../env";
import { TextGenData } from "../data/models";

export function makeGenSample(genData: Exclude<TextGenData["genData"], undefined>) {
    let words = Object.getOwnPropertyNames(genData);
    let nextWord = words[Math.floor(Math.random() * words.length)];
    let result = nextWord;

    let wordData = genData[nextWord];
    for (let i = 0; i < 30; i++) {
        let chosenCumulativeProbability = Math.random();
        let nextWord: string | undefined;

        let words = Object.getOwnPropertyNames(wordData);
        if (words.includes("__genEnd"))
            words.splice(words.indexOf("__genEnd"));
        
        for (let word of words) {
            chosenCumulativeProbability -= wordData[word];
            if (chosenCumulativeProbability <= 0) {
                nextWord = word;
                break;
            }
        }
        if (chosenCumulativeProbability > 0 || nextWord === "__genEnd")
            break;
        
        result += " " + nextWord;
        wordData = genData[nextWord!];
    }

    return result;
};

export function generate(msg: Message<true>) {
    let genData = data.guilds[msg.guildId].channels[msg.channelId].genData;
    if (!genData)
        throw new Error("No gen data found");

    let text = "";
    for (let i = 0; i < 10; i++) {
        let newText = makeGenSample(genData);
        if (newText.length > text.length)
            text = newText;
    }
    return text;
}

export function validateContext(msg: Message<true>) {
    const isMention = msg.mentions.has(client.user!);
    const isReply = msg.reference?.messageId
        && msg.channel.messages.resolve(msg.reference.messageId)?.author.id === client.user!.id;
    const isRandom = Math.random() < 1 / 50;

    return isRandom || isReply || isMention;
};
