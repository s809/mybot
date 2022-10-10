import { Guild } from "../database/models";
import { client } from "../env";
import { getChannel } from "../modules/data/databaseUtil";
import { shouldGenerate, makeTextGenUpdateQuery, generate } from "../modules/messages/genText";

// Collect words from messages
client.on("messageCreate", async msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;
    
    const channelData = (await getChannel(msg.channel, "textGenData"))!;
    if (!channelData[1].textGenData) return;

    const result = makeTextGenUpdateQuery(msg, `channels.${msg.channelId}.textGenData`);
    if (!result) return;

    await Guild.updateOne({
        _id: msg.guildId,
        [`channels.${msg.channelId}.textGenData`]: {
            $exists: true
        }
    }, result);
});

// Message generation
client.on("messageCreate", async msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;
    if (!shouldGenerate(msg)) return;
    
    const channelData = (await getChannel(msg.channel, "textGenData"))!;
    if (!channelData[1].textGenData) return;

    await msg.channel.send({
        content: generate(channelData[1].textGenData, 10),
        allowedMentions: {
            parse: ["users"]
        }
    }).catch(() => { });
});
