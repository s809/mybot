import assert from "assert";
import { Message } from "discord.js";
import { TextGenData } from "../../database/models";
import { RawContents } from "../../database/types";
import { client } from "../../env";
import { escapeKey, unescapeKey } from "../data/databaseUtil";

export function generateSingleSample(genData: RawContents<typeof TextGenData>, maxWords = 30) {
    const firstWordGroups = Object.values(genData.entrypoints);

    const firstWordGroup = firstWordGroups[Math.floor(Math.random() * firstWordGroups.length)];
    let nextWord = firstWordGroup[Math.floor(Math.random() * firstWordGroup.length)];

    let result = unescapeKey(nextWord);
    for (let i = 1; i < maxWords; i++) {
        const wordData = genData.words[nextWord]!;
        let wordIndex = Math.random() * wordData.encounterCount;

        for (const [word, encounters] of Object.entries(wordData.nextWords)) {
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

        result += " " + unescapeKey(nextWord);
    }

    return result;
};

export function generate(textGenData: RawContents<typeof TextGenData>, samples = 10) {
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

export function makeTextGenUpdateQuery(msg: Message<true>, maxWordLength = 30) {
    const words = escapeKey(msg.content.trim())
        .split(/\s+/g)
        .filter(word => word.length <= maxWordLength);
    if (!words[0]?.length) return;

    const changes = new Map<string, {
        addEncounters: number,
        nextWords: Map<string, number>,
        foundLast: boolean
    }>();

    for (let i = 0; i < words.length; i++) {
        const current = words[i];
        const next = words[i + 1];

        let entry = changes.get(current);
        if (!entry) {
            entry = {
                addEncounters: 0,
                nextWords: new Map(),
                foundLast: false
            }
            changes.set(current, entry);
        }

        if (next) {
            entry.nextWords.set(next, entry.nextWords.get(next)! + 1 || 1);
            entry.addEncounters++;
        } else {
            entry.foundLast = true;
        }
    }

    return [{
        $set: {
            [`entrypoints.${words[0]}`]: {
                $setUnion: [
                    { $ifNull: [`$entrypoints.${words[0]}`, []] },
                    words
                ]
            },
            ...Object.fromEntries([...changes].flatMap(([word, entry]) => {
                const wasLastPath = `words.${word}.wasLast`;
                const encounterCountPath = `words.${word}.encounterCount`;
                const nextWordsPath = `words.${word}.nextWords`;

                return [
                    [encounterCountPath, {
                        $add: [
                            { $ifNull: [`$${encounterCountPath}`, 0] },
                            entry.addEncounters,
                            Number(entry.foundLast) && { $toInt: { $not: `$${wasLastPath}` } }
                        ]
                    }],
                    [wasLastPath, entry.foundLast || {
                        $ifNull: [`$${wasLastPath}`, false]
                    }],
                    ...(entry.nextWords.size
                        ? [...entry.nextWords].map(
                            ([nextWord, count]) => {
                                const nextWordPath = `${nextWordsPath}.${nextWord}`;

                                return [nextWordPath, {
                                    $add: [
                                        { $ifNull: [`$${nextWordPath}`, 0] },
                                        count
                                    ]
                                }];
                            })
                        : [<any>[nextWordsPath, { $ifNull: [`$${nextWordsPath}`, {}] }]])
                ];
            }))
        }
    }];
}
