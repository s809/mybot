import { Guild, GuildChannel, Snowflake, User } from "discord.js";
import { ChannelData, Guild as DbGuild, User as DbUser } from "../../database/models";
import { DocumentOf } from "../../database/types";
import { client } from "../../env";
import { ArrayElement } from "../../util";
import { CommandDefinition } from "../commands/definitions";
import { getChannel } from "./databaseUtil";

interface WithFlagData {
    flags: string[];
};

export type FlaggableType = "user" | "guild" | "channel";
export const flaggableTypeChoices: ArrayElement<NonNullable<CommandDefinition["args"]>>["choices"] = [{
    translationKey: "user",
    value: "user"
}, {
    translationKey: "guild",
    value: "guild"
}, {
    translationKey: "channel",
    value: "channel"
}];

export function resolveFlaggableItem(type: "user", id: Snowflake): Promise<[User, DocumentOf<typeof DbUser>] | [null, null]>;
export function resolveFlaggableItem(type: "guild", id: Snowflake): Promise<[Guild, DocumentOf<typeof DbGuild>] | [null, null]>;
export function resolveFlaggableItem(type: "channel", id: Snowflake): Promise<[GuildChannel, ChannelData] | [null, null]>;
export function resolveFlaggableItem(type: FlaggableType, id: Snowflake): Promise<
    [User, DocumentOf<typeof DbUser>] |
    [Guild, DocumentOf<typeof DbGuild>] |
    [GuildChannel, ChannelData] |
    [null, null]
>;
export async function resolveFlaggableItem(type: FlaggableType, id: Snowflake): Promise<[any, any]> {
    switch (type) {
        case "user":
            return [await client.users.fetch(id).catch(() => null), DbUser.findById(id)];
        case "guild":
            return [client.guilds.resolve(id), DbGuild.findById(id)];
        case "channel":
            return [client.channels.resolve(id), getChannel(id)];
        default:
            return [null, null];
    }
}

export function toggleFlag(dataEntry: WithFlagData, flag: string) {
    if (!dataEntry.flags.includes(flag))
        dataEntry.flags.push(flag);
    else
        dataEntry.flags.splice(dataEntry.flags.indexOf(flag));
}

export function setFlag(dataEntry: WithFlagData, flag: string) {
    if (!dataEntry.flags.includes(flag))
        dataEntry.flags.push(flag);
}

export function removeFlag(dataEntry: WithFlagData, flag: string) {
    const index = dataEntry.flags.indexOf(flag);
    if (index !== -1)
        dataEntry.flags.splice(index, 2);
}
