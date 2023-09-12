import { TextGenData } from "../database/models";
import { client, runtimeGuildData } from "../env";
import { shouldGenerate, makeTextGenUpdateQuery, generate } from "../modules/messages/genText";

client.on("messageCreate", async msg => {
    if (!msg.inGuild()) return;
    if (msg.author.bot || msg.webhookId) return;

    // Fetch if result is not cached
    const channelData = runtimeGuildData.get(msg.guildId)
        .channels.get(msg.channelId);
    if (!channelData.textGenEnabled) {
        if (!await TextGenData.findById(msg.channelId)) return;
        channelData.textGenEnabled = true;
    }

    // Collect words from messages

    const result = makeTextGenUpdateQuery(msg);
    if (!result) return;

    if (!shouldGenerate(msg)) {
        await TextGenData.updateOne({ _id: msg.channelId }, result, { runValidators: true });
        return;
    }

    const textGenData = await TextGenData.findByIdAndUpdate(msg.channelId, result, { runValidators: true, new: true }).lean();
    if (!textGenData) return;

    // Message generation
    await msg.channel.send({
        content: generate(textGenData as any, 10),
        allowedMentions: {
            parse: ["users"]
        }
    }).catch(() => { });
});
