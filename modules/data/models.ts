import { Snowflake } from "discord.js";

export interface LanguageData {
    language: string;
}

export type FlagData = {
    flags: string[];
}

export interface PermissionData {
    allowedCommands: string[];
}

export type ChannelLinkRole = "Source" | "Destination";

export interface ChannelLink {
    channelId: Snowflake;
    guildId: Snowflake;
    role: ChannelLinkRole;
    lastMessageId?: Snowflake;
}

export interface InviteTrackerData {
    logChannelId: Snowflake;
}

export interface TextGenData {
    genData?: Record<string, Record<string, number>>;
    genCounters?: Record<string, number>;
}
