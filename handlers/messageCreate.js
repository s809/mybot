import {
    client,
    data,
    owner
} from "../env.js";
import { resolveCommand } from "../modules/commands/commands.js";
import { ChannelLinkRole } from "../modules/data/channelLinking.js";
import { isCommandAllowedToUse } from "../modules/commands/permissions.js";
import sendLongText from "../modules/messages/sendLongText.js";
import { sanitizePaths } from "../util.js";
import { hasFlag } from "../modules/data/flags.js";
import { copyMessageToLinkedChannel } from "../modules/messages/messageCopying.js";
import { getPrefix } from "../modules/commands/getPrefix.js";
import { getLanguageByMessage, getTranslation } from "../modules/misc/translations.js";

client.on("messageCreate", async msg => {
    if (msg.guild) {
        /** @type {import("./modules/data/channelLinking.js").ChannelLink} */
        let link = data.guilds[msg.guildId].channels[msg.channelId].link;

        if (link?.role === ChannelLinkRole.SOURCE)
            await copyMessageToLinkedChannel(msg);
    }

    if (msg.author.bot || msg.webhookId) return;

    if (msg.author.id !== owner) {
        // User ban
        if (hasFlag(data.users[msg.author.id], "banned")) return;

        // Guild ban
        if (msg.guild)
            if (hasFlag(data.guilds[msg.guildId], "banned")) return;
    }

    /** @type {string} */
    const prefix = getPrefix(msg.guildId);
    if (!msg.content.startsWith(prefix)) return;

    let args = msg.content.match(/[^"\s]+|"(?:\\"|[^"])+"/g);
    args.forEach((str, i, arr) => {
        if (i === 0)
            str = str.slice(prefix.length);
        if (str.charAt(0) === "\"")
            str = str.slice(1, -1);

        arr[i] = str.replace("\\\"", "\"").replace("\\\\", "\\");
    });

    let command = resolveCommand(args, true);
    if (command && !isCommandAllowedToUse(msg, command)) return;

    if (!command || !command.func) return;

    const minArgs = command.minArgs ?? 0;
    const maxArgs = command.maxArgs ?? 0;

    if (args.length < minArgs || args.length > maxArgs) {
        let language = getLanguageByMessage(msg);
        
        let [strName, need] = args.length < minArgs
            ? ["arguments_less_than_expected", minArgs]
            : ["arguments_more_than_expected", maxArgs];
        
        await msg.channel.send(getTranslation(language, "errors", strName, need));
        await msg.react("❌");
        return;
    }

    try {
        let reaction = await msg.react("🔄");

        /** @type {string | undefined} */
        let result;
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
