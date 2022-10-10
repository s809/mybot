import { client, isBotOwner } from "../env";
import { resolveCommandLocalized, toUsageString } from "../modules/commands";
import { checkConditions } from "../modules/commands/conditions";
import sendLongText from "../modules/messages/sendLongText";
import { ArrayElement, parseChannelMention, parseRoleMention, parseUserMention, sanitizePaths } from "../util";
import { getPrefix } from "../modules/data/getPrefix";
import { Translator } from "../modules/misc/Translator";
import { logError } from "../log";
import { setTimeout } from "timers/promises";
import { CommandMessage } from "../modules/commands/CommandMessage";
import { Command, CommandHandler } from "../modules/commands/definitions";
import { ApplicationCommandChannelOptionData, ApplicationCommandNumericOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, ApplicationCommandPermissionType, ApplicationCommandStringOptionData, CachedManager, GuildChannel, PermissionFlagsBits, PermissionsBitField, Snowflake } from "discord.js";
import { Guild, User } from "../database/models";

client.on("messageCreate", async msg => {
    if (msg.author.bot || msg.webhookId) return;

    if (!isBotOwner(msg.author)) {
        // User ban
        const user = await User.findByIdOrDefault(msg.author.id, { flags: 1 });
        if (user.flags.includes("banned")) return;

        // Guild ban
        if (msg.guildId) {
            const guild = await Guild.findByIdOrDefault(msg.guildId, { flags: 1 });
            if (guild.flags.includes("banned")) return;
        }
    }

    const prefix = await getPrefix(msg.guildId);
    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).match(/[^"\s]+|"(?:\\"|[^"])+"/g) ?? [];
    for (let [i, str] of args.entries()) {
        if (str.match(/^".*"$/))
            str = str.slice(1, -1);

        args[i] = str.replace("\\\"", "\"").replace("\\\\", "\\");
    }

    const translator = await Translator.getOrDefault(msg, "command_processor");
    const command = resolveCommandLocalized(args, translator);
    if (!command || !command.handler) return;

    // Check permissions
    if (msg.inGuild()) {
        const requiredPermissions = new PermissionsBitField(command.defaultMemberPermissions ?? [])
            .remove(PermissionFlagsBits.UseApplicationCommands);
        let allowed = msg.member!.permissions.has(requiredPermissions);
        
        // App command, if registered
        if (command.appCommandId) {
            const overwrites = await client.application?.commands.permissions.fetch({
                guild: msg.guild,
                command: command.appCommandId
            }).catch(() => [] as ApplicationCommandPermissions[])!;

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

    const commandMessage = new CommandMessage(command, await Translator.getOrDefault(msg, command.translationPath), msg);

    // Check conditions
    const checkResult = checkConditions(commandMessage, command);
    if (checkResult) {
        await msg.channel.send(checkResult);
        return;
    }

    if (args.length < command.args.min || args.length > command.args.max) {
        let errorStr = args.length < command.args.min
            ? translator.translate("errors.too_few_arguments")
            : translator.translate("errors.too_many_arguments");

        await msg.channel.send(errorStr + "\n"
            + translator.translate("strings.command_usage", await toUsageString(msg, command, translator.translator)));
        await msg.react("❌");
        return;
    }

    // Combined for numeric & integer
    const parseNumberValue = (input: string, arg: ArrayElement<NonNullable<Command>["args"]["list"]>, check: (x: number) => boolean) => {
        const value = parseInt(input);
        const arga = arg as ApplicationCommandNumericOptionData;

        if (!check(value))
            throw ["invalid_numeric", input];
        if (arga.choices && !arga.choices.some(c => c.value === value))
            throw ["value_not_allowed", input, arga.choices.map(c => c.value).join(", ")];
        if (arga.minValue && value < arga.minValue)
            throw ["value_too_small", input, arga.minValue];
        if (arga.maxValue && value > arga.maxValue)
            throw ["value_too_large", input, arga.maxValue];

        return value;
    }

    // Combined for objects gotten with their managers
    const parseResolvableValue = (input: string, arg: ArrayElement<NonNullable<Command>["args"]["list"]>, parse: (text: string) => string | null, manager: CachedManager<Snowflake, any, any> | undefined) => {
        const id = parse(input);
        if (id === null)
            throw ["invalid_channel", input];

        const result = manager?.resolve(id);
        if (!result)
            throw ["invalid_channel", input];

        return result;
    }

    const argsObj = {} as Parameters<CommandHandler>["1"];
    const argToGetter = new Map<ApplicationCommandOptionType, (value: string, arg: ArrayElement<NonNullable<Command>["args"]["list"]>) => any>([
        [ApplicationCommandOptionType.String, (input, arg) => {
            const arga = arg as ApplicationCommandStringOptionData;

            if (arga.choices) {
                // Transform localized choice to internal value
                for (const choice of arga.choices) {
                    const localization = (choice.nameLocalizations as any)[translator.localeString];
                    if (localization && input.toLocaleLowerCase() === localization // translator's locale
                        || input.toLocaleLowerCase() === choice.name) // default locale
                        return choice.value;
                }
                
                throw ["value_not_allowed", input, arga.choices.map(choice => `"${(choice.nameLocalizations as any)[translator.localeString] ?? choice.name}"`).join(", ")];
            } else {
                if (arga.minLength && input.length < arga.minLength)
                    throw ["value_too_small", input, arga.minLength];
                if (arga.maxLength && input.length > arga.maxLength)
                    throw ["value_too_long", input, arga.maxLength];
            }
            
            return input;
        }],
        [ApplicationCommandOptionType.Number, (input, arg) => parseNumberValue(input, arg, n => !isNaN(n))],
        [ApplicationCommandOptionType.Integer, (input, arg) => parseNumberValue(input, arg, Number.isSafeInteger)],
        [ApplicationCommandOptionType.Boolean, input => {
            const zipped = translator.booleanValues.map((v, i) => v.concat(Translator.fallbackTranslator.booleanValues[i]));
            for (const [i, variants] of zipped.entries()) {
                if (variants.includes(input.toLocaleLowerCase()))
                    return Boolean(i);
            }
            throw ["invalid_boolean", input];
        }],
        [ApplicationCommandOptionType.Channel, (input, arg) => {
            const resolvedChannel: GuildChannel = parseResolvableValue(input, arg, parseChannelMention, msg.guild?.channels);
            const fits = (arg as ApplicationCommandChannelOptionData).channelTypes?.some(type => resolvedChannel.type === type) ?? true;
            if (!fits)
                throw ["channel_constraints_not_met", resolvedChannel.toString()];
            return resolvedChannel;
        }],
        [ApplicationCommandOptionType.User, (input, arg) => parseResolvableValue(input, arg, parseUserMention, msg.guild?.members)],
        [ApplicationCommandOptionType.Role, (input, arg) => parseResolvableValue(input, arg, parseRoleMention, msg.guild?.roles)],
    ]);

    for (const arg of command.args.list) {
        let getter = argToGetter.get(arg.type);
        if (!getter) {
            // Unsupported argument type
            await msg.channel.send(translator.translate("errors.unsupported_argument_type"));
            return;
        }

        const argValue = args.shift()!;
        if (!arg.required && !argValue)
            continue;

        try {
            argsObj[arg.translationKey] = getter(argValue, arg);
        } catch (e) {
            if (Array.isArray(e)) {
                const argName = translator.getTranslationFromRecord(arg.nameLocalizations!);
                const valueWithArgName = `"${e[1]}" (${translator.translate("strings.argument_name", argName)})`;

                await msg.channel.send(translator.translate(`errors.${e[0]}`, valueWithArgName, ...e.slice(2)));
            } else {
                await msg.channel.send(e.message);
            }
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
        const errorTranslationPath = `${command.translationPath}.errors.${result ?? ""}`;
        await Promise.allSettled([
            // update status if reaction is present
            reaction || (command.alwaysReactOnSuccess && success)
                ? msg.react(success ? "✅" : "❌")
                : undefined,
            
            // remove reaction if it's present
            reaction?.then(reaction => reaction?.users.remove()),

            // send result if it was returned
            !success
                ? msg.channel.send(Translator.fallbackTranslator.tryTranslate(errorTranslationPath)
                    ? translator.translate(errorTranslationPath)
                    : result!)
                : undefined
        ]);
    }
    catch (e) {
        logError(e);
    }
});
