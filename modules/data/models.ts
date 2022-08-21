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

export interface InviteTrackerData {
    logChannelId: Snowflake;
}

export interface TextGenData {
    genData?: Record<string, Record<string, number>>;
    genCounters?: Record<string, number>;
}
