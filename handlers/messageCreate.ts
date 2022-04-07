import {
    client,
    data,
    isBotOwner
} from "../env";
import { resolveCommand } from "../modules/commands";
import { ChannelLink } from "../modules/data/models";
import { isCommandAllowedToUse } from "../modules/commands/permissions";
import sendLongText from "../modules/messages/sendLongText";
import { sanitizePaths } from "../util";
import { hasFlag } from "../modules/data/flags";
import { copyMessageToLinkedChannel } from "../modules/messages/messageCopying";
import { getPrefix } from "../modules/data/getPrefix";
import { Translator } from "../modules/misc/Translator";

client.on("messageCreate", async msg => {
    if (msg.guild) {
        let link: ChannelLink = data.guilds[msg.guildId].channels[msg.channelId].link;

        if (link?.role === "SOURCE")
            await copyMessageToLinkedChannel(msg);
    }

    if (msg.author.bot || msg.webhookId) return;

    if (!isBotOwner(msg.author)) {
        // User ban
        if (hasFlag(data.users[msg.author.id], "banned")) return;

        // Guild ban
        if (msg.guild)
            if (hasFlag(data.guilds[msg.guildId], "banned")) return;
    }

    const prefix = getPrefix(msg.guildId);
    if (!msg.content.startsWith(prefix)) return;

    let args = msg.content.slice(prefix.length).match(/[^"\s]+|"(?:\\"|[^"])+"/g);
    for (let [i, str] of args.entries()) {
        if (str.match(/^".*"$/))
            str = str.slice(1, -1);

        args[i] = str.replace("\\\"", "\"").replace("\\\\", "\\");
    }

    let command = resolveCommand(args, true);
    if (command && !isCommandAllowedToUse(msg, command)) return;

    if (!command || !command.func) return;

    let minArgs = command.args?.[0] ?? 0;
    let maxArgs = command.args?.[1] ?? 0;

    if (args.length < minArgs || args.length > maxArgs) {
        let [strName, need] = args.length < minArgs
            ? ["arguments_less_than_expected", minArgs]
            : ["arguments_more_than_expected", maxArgs];

        await msg.channel.send(Translator.get(msg).translate(`errors.${strName}`, need.toString()));
        await msg.react("❌");
        return;
    }

    try {
        let reaction = await msg.react("🔄");

        let result: string | void;
        try {
            result = await command.func(msg, ...args);
        }
        catch (e) {
            console.log(e.stack);
            await sendLongText(msg.channel, sanitizePaths(e.stack));
        }

        await Promise.allSettled([
            msg.react(typeof result !== "string" ? "✅" : "❌"),
            reaction.users.remove(),
            (async () => {
                if (typeof result === "string")
                    await msg.channel.send(result);
            })()
        ]);
    }
    catch (e) {
        console.error(e.stack);
    }
});
