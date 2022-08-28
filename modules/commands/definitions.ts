/**
 * @file Contains definitions for commands.
 */

import { ApplicationCommandData, ApplicationCommandSubCommandData, Awaitable, Channel, ChannelType, LocaleString, Role, Snowflake, User } from "discord.js";
import { ArrayElement, DistributiveOmit, Overwrite } from "../../util";
import { CommandMessage } from "./CommandMessage";
import { CommandRequirement } from "./requirements";

export const textChannels = [
    ChannelType.GuildNews,
    ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread, ChannelType.GuildNewsThread,
    ChannelType.GuildText
];

export interface CommandDefinition {
    key: string;

    usableAsAppCommand?: boolean;
    defaultMemberPermissions?: ApplicationCommandData["defaultMemberPermissions"];
    allowDMs?: boolean;

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
        isExtras?: boolean;
    })[];
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
        list: (ArrayElement<NonNullable<ApplicationCommandSubCommandData["options"]>> & {
            translationKey: string;
        })[],
        lastArgAsExtras: boolean;
    };
    handler: CommandHandler | null;

    appCommandId: Snowflake | null;

    subcommands: Map<string, Command>;
    requirements: CommandRequirement[];
}>

export type CommandHandler = (
    msg: CommandMessage,
    args: Record<string, string | string[] | number | boolean | User | Channel | Role>
) => Awaitable<string | void>;
