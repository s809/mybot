import assert from "assert";
import { Message } from "discord.js";
import { ChannelData } from "../../database/models";
import { client } from "../../env";

type TextGenData = NonNullable<ChannelData["textGenData"]>;

export function generateSingleSample(genData: TextGenData, maxWords = 30) {
    const firstWordGroup = [...genData.entrypoints.values()][Math.floor(Math.random() * genData.entrypoints.size)];
    let nextWord = firstWordGroup[Math.floor(Math.random() * firstWordGroup.length)];
    
    let result = nextWord;
    for (let i = 1; i < maxWords; i++) {
        const wordData = genData.words.get(nextWord)!;
        let wordIndex = Math.random() * wordData.encounterCount;

        for (const [word, encounters] of wordData.nextWords) {
            wordIndex -= encounters;
            if (wordIndex <= 0) {
                nextWord = word;
                break;
            }
        }

        if (wordIndex > 0) {
            assert(wordData.wasLast);
            break;
        }
        
        result += " " + nextWord;
    }

    return result;
};

export function generate(textGenData: TextGenData, samples = 10) {
    let text = "";
    for (let i = 0; i < samples; i++) {
        let newText = generateSingleSample(textGenData);
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

export function collectWordsFromMessage(msg: Message<true>, textGenData: TextGenData, maxWordLength = 30) {
    const words = msg.content.trim().split(/\s+/g).filter(word => word.length <= maxWordLength);
    if (!words[0]?.length) return;

    textGenData.entrypoints.set(words[0], [...new Set([
        ...(textGenData.entrypoints.get(words[0]) ?? []),
        ...words
    ])]);

    for (let i = 0; i < words.length; i++) {
        const current = words[i];
        const next = words[i + 1];

        const entry = textGenData.words.get(current) ?? {
            encounterCount: 0,
            nextWords: new Map(),
            wasLast: false
        };
        const isNewEntry = !entry.encounterCount;

        if (next) {
            entry.nextWords.set(next, entry.nextWords.get(next) + 1 || 1);
            entry.encounterCount++;
        } else if (!entry.wasLast) {
            entry.wasLast = true;
            entry.encounterCount++;
        }
        
        if (isNewEntry)
            textGenData.words.set(current, entry);
    }
}
