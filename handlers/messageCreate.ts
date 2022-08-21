import { client, data, isBotOwner } from "../env";
import { resolveCommand, toUsageString } from "../modules/commands";
import { checkRequirementsBeforeRunning } from "../modules/commands/requirements";
import sendLongText from "../modules/messages/sendLongText";
import { sanitizePaths } from "../util";
import { hasFlag } from "../modules/data/flags";
import { getPrefix } from "../modules/data/getPrefix";
import { Translator } from "../modules/misc/Translator";
import { logError } from "../log";
import { setTimeout } from "timers/promises";
import { CommandMessage } from "../modules/commands/appCommands";

client.on("messageCreate", async msg => {
    if (msg.author.bot || msg.webhookId) return;

    if (!isBotOwner(msg.author)) {
        // User ban
        if (hasFlag(data.users[msg.author.id], "banned")) return;

        // Guild ban
        if (msg.guildId)
            if (hasFlag(data.guilds[msg.guildId], "banned")) return;
    }

    const prefix = getPrefix(msg.guildId);
    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).match(/[^"\s]+|"(?:\\"|[^"])+"/g) ?? [];
    for (let [i, str] of args.entries()) {
        if (str.match(/^".*"$/))
            str = str.slice(1, -1);

        args[i] = str.replace("\\\"", "\"").replace("\\\\", "\\");
    }

    const commandMessage = new CommandMessage(msg);

    const command = resolveCommand(args, true);
    if (!command || !command.handler) return;

    const checkResult = checkRequirementsBeforeRunning(commandMessage, command);
    if (!checkResult.allowed) {
        if (checkResult.message)
            await msg.channel.send(checkResult.message);
        return;
    }

    if (args.length < command.args.min || args.length > command.args.max) {
        let translator = Translator.getOrDefault(msg);
        let errorStr = args.length < command.args.min
            ? translator.translate("errors.too_few_arguments")
            : translator.translate("errors.too_many_arguments");

        await msg.channel.send(errorStr +
            translator.translate("common.command_usage", toUsageString(msg, command, translator)));
        await msg.react("❌");
        return;
    }

    try {
        let reaction;
        let result: string | undefined;
        try {
            let finished = false;

            const promise = Promise.resolve(command.handler(commandMessage, ...args)).then((result: any) => {
                finished = true;
                return result;
            });

            result = await Promise.race([
                promise,
                setTimeout(1000)
            ]);

            if (!finished) {
                reaction = msg.react("🔄").catch(() => { });
                result = await promise;
            }
        }
        catch (e) {
            logError(e);
            await sendLongText(msg.channel, sanitizePaths(e.stack));
        }

        const success = typeof result !== "string";
        await Promise.allSettled([
            // update status if reaction is present
            reaction || (command.alwaysReactOnSuccess && success)
                ? msg.react(success ? "✅" : "❌")
                : undefined,
            
            // remove reaction if it's present
            reaction?.then(reaction => reaction?.users.remove()),

            // send result if it was returned
            !success
                ? msg.channel.send(result!)
                : undefined
        ]);
    }
    catch (e) {
        logError(e);
    }
});
