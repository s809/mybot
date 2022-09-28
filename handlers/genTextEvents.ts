import { client } from "../env";
import { getChannel } from "../modules/data/databaseUtil";
import { shouldGenerate, collectWordsFromMessage, generate } from "../modules/messages/genText";

// Collect words from messages
client.on("messageCreate", async msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;
    
    const channelData = (await getChannel(msg.channel))!;
    if (!channelData[1].textGenData) return;

    collectWordsFromMessage(msg, channelData[1].textGenData);
    await channelData[0].save();
});

// Message generation
client.on("messageCreate", async msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;
    if (!shouldGenerate(msg)) return;
    
    const channelData = (await getChannel(msg.channel))!;
    if (!channelData[1].textGenData) return;

    await msg.channel.send({
        content: generate(channelData[1].textGenData, 10),
        allowedMentions: {
            parse: ["users"]
        }
    }).catch(() => { });
});
