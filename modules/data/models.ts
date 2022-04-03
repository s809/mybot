import { Snowflake } from "discord.js";

export type FlaggableDataEntry = {
    flags: string[];
}

export type ChannelLinkRole = "SOURCE" | "DESTINATION";

export interface ChannelLink {
    channelId: Snowflake;
    guildId: Snowflake;
    role: ChannelLinkRole;
    lastMessageId?: Snowflake;
}

export interface InviteTrackerData {
    logChannelId: Snowflake;
}
