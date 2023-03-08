import { Message } from "discord.js";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { iterateMessages } from "../../modules/messages/iterateMessages";

async function test(msg: CommandRequest<true>) {
    const response = await msg.deferReply();

    const channel = await msg.guild.channels.create({
        name: "iterate-messages"
    });

    const messages = [];
    for (let i = 1; i <= 5; i++)
        messages.push(await channel.send(i.toString()));
    
    const doTest = async (title: string, reference: string, iterable: AsyncGenerator<Message, void, unknown>) => {
        let result = await msg.sendSeparate(`--- ${title} ---\nReference: ${reference}\nResult: `);
        for await (const message of iterable)
            await result.edit(result.content + " " + message.content);
    }
    
    await doTest("No parameters", "5 4 3 2 1", iterateMessages(channel));
    await doTest("Only end", "4 3 2 1", iterateMessages(channel, null, messages[3].id));
    await doTest("Begin only", "2 3 4 5", iterateMessages(channel, messages[1].id));
    await doTest("Begin and end", "2 3 4", iterateMessages(channel, messages[1].id, messages[3].id));
    await doTest("Begin and end reversed", "4 3 2", iterateMessages(channel, messages[3].id, messages[1].id));
    await doTest("Count only", "5 4", iterateMessages(channel, null, null, 2));
    await doTest("Begin with count", "2 3", iterateMessages(channel, messages[1].id, null, 2));
    await doTest("End with count", "4 3", iterateMessages(channel, null, messages[3].id, 2));
    await doTest("Begin and end with count", "2 3", iterateMessages(channel, messages[1].id, messages[3].id, 2));
    await doTest("Begin and end with count reversed", "4 3", iterateMessages(channel, messages[3].id, messages[1].id, 2));

    await response.edit("Done.");
    await channel.delete();
}

export default defineCommand({
    key: "iteratemessages",
    handler: test
});
