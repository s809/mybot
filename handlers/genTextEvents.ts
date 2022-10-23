import { Guild, TextGenData } from "../database/models";
import { client, textGenEnabledChannels } from "../env";
import { shouldGenerate, makeTextGenUpdateQuery, generate } from "../modules/messages/genText";

client.on("messageCreate", async msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;
    
    // Fetch if result is not cached
    if (!textGenEnabledChannels.has(msg.channelId)) {
        if (!await TextGenData.findById(msg.channelId)) return;
        textGenEnabledChannels.add(msg.channelId);
    }

    // Collect words from messages

    const result = makeTextGenUpdateQuery(msg);
    if (!result) return;

    if (!shouldGenerate(msg)) {
        await TextGenData.updateOne({ _id: msg.channelId }, result, { runValidators: true });
        return;
    }
    
    const textGenData = await TextGenData.findByIdAndUpdate(msg.channelId, result, { runValidators: true, new: true });
    if (!textGenData) return;
    
    // Message generation
    await msg.channel.send({
        content: generate(textGenData, 10),
        allowedMentions: {
            parse: ["users"]
        }
    }).catch(() => { });
});
