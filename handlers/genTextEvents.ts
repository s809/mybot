import { client, data } from "../env";
import { hasFlag, resolveFlaggableItem } from "../modules/data/flags";
import { shouldGenerate, collectWordsFromMessage, generate } from "../modules/messages/genText";

// Collect words from messages
client.on("messageCreate", msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;

    let channelData = data.guilds[msg.guildId].channels[msg.channelId];
    if (!hasFlag(channelData, "genText")) return;

    collectWordsFromMessage(msg, channelData);
});

// Message generation
client.on("messageCreate", async msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;
    if (!shouldGenerate(msg)) return;
    if (!hasFlag((await resolveFlaggableItem(msg, msg.channel.id))!.dataEntry, "genText")) return;

    await msg.channel.send({
        content: generate(msg, 10),
        allowedMentions: {
            parse: ["users"]
        }
    }).catch(() => { });
});
