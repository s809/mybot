import { client, data, isBotOwner } from "../env";
import { resolveCommand, toUsageString } from "../modules/commands";
import { checkRequirementsBeforeRunning } from "../modules/commands/requirements";
import sendLongText from "../modules/messages/sendLongText";
import { parseChannelMention, parseRoleMention, parseUserMention, sanitizePaths } from "../util";
import { hasFlag } from "../modules/data/flags";
import { getPrefix } from "../modules/data/getPrefix";
import { Translator } from "../modules/misc/Translator";
import { logError } from "../log";
import { setTimeout } from "timers/promises";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { CommandHandler } from "../modules/commands/definitions";
import { ApplicationCommandOptionType, ApplicationCommandPermissions, ApplicationCommandPermissionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";

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

    // Check permissions if in guild
    if (msg.inGuild()) {
        const requiredPermissions = new PermissionsBitField(command.defaultMemberPermissions ?? [])
            .remove(PermissionFlagsBits.UseApplicationCommands);
        let allowed = msg.member!.permissions.has(requiredPermissions);
        
        // App command, if registered
        if (command.appCommandId) {
            const overwrites = await client.application?.commands.permissions.fetch({
                guild: msg.guild,
                command: command.appCommandId
            }).catch(e => [] as ApplicationCommandPermissions[])!;

            let allowedInChannel = true;
            let rolePosition = -1;
            checkOverwrites:
            for (const overwrite of overwrites) {
                switch (overwrite.type) {
                    case ApplicationCommandPermissionType.Role:
                        const role = msg.member!.roles.resolve(overwrite.id);
                        if (role && role.position > rolePosition)
                            allowed = overwrite.permission;
                        break;
                    case ApplicationCommandPermissionType.User:
                        if (overwrite.id === msg.author.id) {
                            allowed = overwrite.permission;
                            break checkOverwrites;
                        }
                        break;
                    case ApplicationCommandPermissionType.Channel:
                        if (overwrite.id === msg.channelId) {
                            allowedInChannel = overwrite.permission;
                            
                            if (!overwrite.permission)
                                break checkOverwrites;
                        } else if (BigInt(overwrite.id) === BigInt(msg.guildId) - 1n) {
                            allowedInChannel = overwrite.permission;
                        }
                        break;
                }
            }

            allowed &&= allowedInChannel;
        }

        if (!allowed && !isBotOwner(msg.author)) return;
    } else {
        if (command.allowDMs === false)
            return;
    }

    // Check conditions
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

    const argsObj = {} as Parameters<CommandHandler>["1"];
    const argToGetter = new Map<ApplicationCommandOptionType, (value: string) => any>([
        [ApplicationCommandOptionType.String, x => x],
        [ApplicationCommandOptionType.Number, x => {
            const result = parseInt(x);
            if (isNaN(result))
                throw new Error(`${x} is not a valid number.`);
            return result;
        }],
        [ApplicationCommandOptionType.Boolean, x => {
            if (["yes", "y", "true"].includes(x.toLocaleLowerCase())) // TODO localized options
                return true;
            else if (["no", "n", "false"].includes(x.toLocaleLowerCase()))
                return false;
            else
                throw new Error(`${x} is not a valid boolean parameter.`)
        }],
        [ApplicationCommandOptionType.Channel, x => {
            const id = parseChannelMention(x);
            if (id === null)
                throw new Error(`${x} is not a valid channel.`)
            const result = msg.guild?.channels.resolve(id);
            if (!result)
                throw new Error(`${x} is not a valid channel.`)
            return result;
        }],
        [ApplicationCommandOptionType.User, x => {
            const id = parseUserMention(x);
            if (id === null)
                throw new Error(`${x} is not a valid user.`)
            const result = msg.guild?.members.resolve(id);
            if (!result)
                throw new Error(`${x} is not a valid user.`)
            return result;
        }],
        [ApplicationCommandOptionType.Role, x => {
            const id = parseRoleMention(x);
            if (id === null)
                throw new Error(`${x} is not a valid role.`)
            const result = msg.guild?.roles.resolve(id);
            if (!result)
                throw new Error(`${x} is not a valid role.`)
            return result;
        }],
    ]);

    for (const arg of command.args.list) {
        let getter = argToGetter.get(arg.type);
        if (!getter) {
            // Unsupported argument type
            await msg.channel.send({
                content: "Unknown error. (Code: 42)"
            });
            return;
        }

        try {
            argsObj[arg.translationKey] = getter(args.shift()!);
        } catch (e) {
            await msg.channel.send(e.message);
            return;
        }
    }
    
    // Append remaining arguments to extras argument
    if (command.args.lastArgAsExtras) {
        const lastArg = command.args.list[command.args.list.length - 1];
        args.unshift(argsObj[lastArg.translationKey] as string ?? "");
        argsObj[lastArg.translationKey] = args;
    }

    try {
        let reaction;
        let result: string | undefined;
        try {
            let finished = false;

            const promise = Promise.resolve(command.handler(commandMessage, argsObj)).then((result: any) => {
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
