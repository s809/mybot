import { client, data } from "../env";
import { hasFlag, resolveFlaggableItem } from "../modules/data/flags";
import { validateContext, makeGenSample } from "../modules/messages/genText";

// Collect words from messages
client.on("messageCreate", msg => {
    if (!msg.guild) return;
    if (msg.author.bot || msg.webhookId) return;

    let channelData = data.guilds[msg.guildId].channels[msg.channelId];
    if (!hasFlag(channelData, "genText")) return;

    let words = msg.content.split(/\s+/g).filter(word => word.length && word.length <= 30);
    words.push("__genEnd");

    for (let i = 0; i < words.length - 1; i++) {
        let word = words[i];
        let nextWord = words[i + 1];
        let genCounters = channelData.genCounters;
        genCounters[word] ??= 0;

        if (typeof genCounters[word] !== "number")
            continue;

        channelData.genData[word] ??= {};
        let wordData = channelData.genData[word];

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
});

// Message generation
client.on("messageCreate", async msg => {
    if (!msg.guild) return;
    if (msg.author.bot || msg.webhookId) return;
    if (!validateContext(msg)) return;
    if (!hasFlag((await resolveFlaggableItem(msg, msg.channel.id)).dataEntry, "genText")) return;

    let genData = data.guilds[msg.guildId].channels[msg.channelId].genData;
    let text = "";
    for (let i = 0; i < 10; i++) {
        let newText = makeGenSample(genData);
        if (newText.length > text.length)
            text = newText;
    }
    await msg.channel.send({
        content: text,
        allowedMentions: {
            parse: ["users"]
        }
    }).catch(() => { });
});
