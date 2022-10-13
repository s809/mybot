import { Guild, GuildChannel, Snowflake, User } from "discord.js";
import { isNull } from "lodash-es";
import { ChannelData, Guild as DbGuild, User as DbUser } from "../../database/models";
import { DocumentOf } from "../../database/types";
import { client } from "../../env";
import { ArrayElement } from "../../util";
import { CommandDefinition } from "../commands/definitions";
import { getChannel } from "./databaseUtil";

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
export async function resolveFlaggableItem(type: FlaggableType, id: Snowflake): Promise<any> {
    switch (type) {
        case "user":
            return [await client.users.fetch(id).catch(() => null), await DbUser.findByIdOrDefault(id, { flags: 1 })];
        case "guild":
            return [client.guilds.resolve(id), await DbGuild.findByIdOrDefault(id, { flags: 1 })];
        case "channel":
            return [client.channels.resolve(id), (await getChannel(id, "flags"))?.[1] ?? null];
        default:
            return [null, null];
    }
}
