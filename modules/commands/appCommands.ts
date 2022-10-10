import assert from 'assert';
import { ChatInputApplicationCommandData, ApplicationCommandType, ApplicationCommandOptionType, ApplicationCommandSubGroupData } from 'discord.js';
import { getRootCommands, iterateCommands, iterateSubcommands } from '.';
import { client } from '../../env';
import { defaults } from "../../constants";

export async function refreshCommands() {
    const commands: ChatInputApplicationCommandData[] = [];

    for (const command of iterateCommands()) {
        if (!command.usableAsAppCommand)
            continue;

        try {
            if (command.handler && command.subcommands.size)
                throw new Error("Commands with subcommands cannot be run on their own.");

            const data: ChatInputApplicationCommandData & {
                options: typeof command.args.list;
            } = {
                name: command.nameTranslations[defaults.locale],
                description: command.descriptionTranslations[defaults.locale],
                nameLocalizations: command.nameTranslations,
                descriptionLocalizations: command.descriptionTranslations,
                options: command.args.list,
                dmPermission: command.allowDMs,
                defaultMemberPermissions: command.defaultMemberPermissions
            };

            const pathParts = command.path.split('/');
            switch (pathParts.length) {
                case 1:
                    commands.push({
                        ...data,
                        type: ApplicationCommandType.ChatInput,
                    });
                    break;
                case 2:
                    const c = commands.find(c => c.name === pathParts[0])!;
                    c.options ??= [];
                    c.options.push({
                        ...data,
                        type: ApplicationCommandOptionType.Subcommand,
                    });
                    break;
                case 3:
                    const cc = commands.find(c => c.name === pathParts[0])!;
                    const s = cc.options!.find(s => s.name === pathParts[1])! as ApplicationCommandSubGroupData;
                    s.type = ApplicationCommandOptionType.SubcommandGroup;
                    s.options ??= [];
                    s.options.push({
                        ...data,
                        type: ApplicationCommandOptionType.Subcommand,
                    });
                    break;
                default:
                    throw new Error("Command depth exceeded.");
            }
        } catch (e) {
            e.message += `\nPath: ${command.path}`;
            throw e;
        }
    }

    const result = await client.application?.commands.set(commands);
    if (!result) return;

    const rootCommands = getRootCommands();
    for (const appCommand of result.values()) {
        if (appCommand.type !== ApplicationCommandType.ChatInput) continue;

        const rootCommand = rootCommands.find(x => x.nameTranslations[defaults.locale] === appCommand.name);
        assert(rootCommand, `Failed to find source command for ${appCommand.name}`);
        rootCommand.appCommandId = appCommand.id;
        
        for (const command of iterateSubcommands(rootCommand.subcommands)) {
            if (command.usableAsAppCommand)
                command.appCommandId = appCommand.id;
        }
    }
}
