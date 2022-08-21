/**
 * @file Contains definitions for commands.
 */

import { ApplicationCommandSubCommandData, Awaitable, ChannelType, LocaleString } from "discord.js";
import { ArrayElement, DistributiveOmit, Overwrite } from "../../util";
import { CommandMessage } from "./appCommands";
import { CommandRequirement } from "./requirements";

export const textChannels = [
    ChannelType.DM, ChannelType.GroupDM,
    ChannelType.GuildNews,
    ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread, ChannelType.GuildNewsThread,
    ChannelType.GuildText, ChannelType.GuildForum
];

export interface CommandDefinition {
    key: string;

    args?: (DistributiveOmit<
        ArrayElement<NonNullable<ApplicationCommandSubCommandData["options"]>>,
        "name" | "nameLocalizations" | "description" | "descriptionLocalizations" |
        "choices"
    > & {
        translationKey: string;
        choices?: {
            translationKey: string;
            value: string | number;
        }[];
    })[];
    usableAsAppCommand?: boolean;
    handler?: CommandHandler;
    alwaysReactOnSuccess?: boolean;
    
    subcommands?: CommandDefinition[];
    requirements?: CommandRequirement | CommandRequirement[];
}

export type Command = Overwrite<{
    [K in keyof CommandDefinition]-?: NonNullable<CommandDefinition[K]>;
}, {
    path: string;
    translationPath: string;
    nameTranslations: Record<LocaleString, string>;
    descriptionTranslations: Record<LocaleString, string>;

    args: {
        min: number;
        max: number;
        stringTranslations: Record<LocaleString, string>;
        list: NonNullable<ApplicationCommandSubCommandData["options"]>
    };
    handler: CommandHandler | null;

    subcommands: Map<string, Command>;
    requirements: CommandRequirement[];
}>

export type CommandHandler = (msg: CommandMessage, ...args: string[]) => Awaitable<string | void>;
