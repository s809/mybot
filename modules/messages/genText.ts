import { Message } from "discord.js";
import { client, data } from "../../env";
import { TextGenData } from "../data/models";

export function makeGenSample(genData: TextGenData["genData"]) {
    let words = Object.getOwnPropertyNames(genData);
    let nextWord = words[Math.floor(Math.random() * words.length)];
    let result = nextWord;

    let wordData = genData[nextWord];
    for (let i = 0; i < 30; i++) {
        let value = Math.random();
        let nextWord;

        let words = Object.getOwnPropertyNames(wordData);
        if (words.includes("__genEnd"))
            words.splice(words.indexOf("__genEnd"));
        for (let word of words) {
            value -= wordData[word];
            if (value <= 0) {
                nextWord = word;
                break;
            }
        }
        if (value > 0 || nextWord === "__genEnd")
            break;
        result += " " + nextWord;
        wordData = genData[nextWord];
    }

    return result;
};

export function generate(msg: Message) {
    let genData = data.guilds[msg.guildId].channels[msg.channelId].genData;

    let text = "";
    for (let i = 0; i < 10; i++) {
        let newText = makeGenSample(genData);
        if (newText.length > text.length)
            text = newText;
    }
    return text;
}

export function validateContext(msg: Message) {
    const isMention = msg.mentions.has(client.user);
    const isReply = msg.channel.messages.resolve(msg.reference?.messageId)?.author.id === client.user.id;
    const isRandom = Math.random() < 1 / 50;

    return isRandom || isReply || isMention;
};
