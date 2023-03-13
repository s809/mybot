import { Guild, GuildChannel, Snowflake, User } from "discord.js";
import { ChannelData, Guild as DbGuild, User as DbUser } from "../../database/models";
import { DocumentOf } from "../../database/types";
import { client } from "../../env";
import { ArrayElement } from "../../util";
import { CommandDefinition } from "@s809/noisecord";
import { getChannel } from "./databaseUtil";

export type FlaggableType = "user" | "guild" | "channel";
export const flaggableTypeChoices: ArrayElement<NonNullable<CommandDefinition["args"]>>["choices"] = [{
    key: "user",
    value: "user"
}, {
    key: "guild",
    value: "guild"
}, {
    key: "channel",
    value: "channel"
}];

export function getItemForFlags(type: "user", id: Snowflake): Promise<{
    item: User,
    data: DocumentOf<typeof DbUser>
} | null>;
export function getItemForFlags(type: "guild", id: Snowflake): Promise<{
    item: Guild,
    data: DocumentOf<typeof DbGuild>
} | null>;
export function getItemForFlags(type: "channel", id: Snowflake): Promise<{
    item: GuildChannel,
    data: ChannelData
} | null>;
export function getItemForFlags(type: FlaggableType, id: Snowflake): Promise<{
    item: User | Guild | GuildChannel,
    data: DocumentOf<typeof DbUser> | DocumentOf<typeof DbGuild> | ChannelData
} | null>;
export async function getItemForFlags(type: FlaggableType, id: Snowflake): Promise<{
    item: User | Guild | GuildChannel,
    data: DocumentOf<typeof DbUser> | DocumentOf<typeof DbGuild> | ChannelData
} | null> {
    switch (type) {
        case "user": {
            const item = await client.users.fetch(id).catch(() => null);
            return item
                ? {
                    item,
                    data: await DbUser.findByIdOrDefault(id, { flags: 1 })
                }
                : null;
        }
        case "guild": {
            const item = client.guilds.resolve(id);
            return item
                ? {
                    item,
                    data: await DbGuild.findByIdOrDefault(id, { flags: 1 })
                }
                : null;
        }
        case "channel": {
            const item = client.channels.resolve(id);
            return item instanceof GuildChannel
                ? {
                    item,
                    data: (await getChannel(id, "flags"))!.data
                }
                : null;
        }
        default: {
            return null;
        }
    }
}

// getFlags(item) is NOT implemented
// query database yourself

const createRemoveFlagPart = (flag: string) => ({
    $filter: {
        input: "$$currentFlags",
        cond: {
            $ne: ["$$this", flag]
        }
    }
});

const createAddFlagPart = (flag: string) => ({
    $setUnion: [
        "$$currentFlags",
        [flag]
    ]
});

const createToggleFlagPart = (flag: string) => ({
    $cond: {
        if: {
            $in: [
                flag,
                "$$currentFlags"
            ]
        },
        then: createRemoveFlagPart(flag),
        else: createAddFlagPart(flag)
    }
});

async function updateFlags(item: User | Guild | GuildChannel, queryPart: object) {
    let model: typeof DbGuild | typeof DbUser = DbGuild;
    let id = item.id;
    let dbPath = "flags";

    if (item instanceof User) {
        model = DbUser;
    } else if (item instanceof GuildChannel) {
        id = item.guildId;
        dbPath = `channels.${item.id}.flags`;
    }

    await (model as any).updateByIdWithUpsert(id, [{
        $set: {
            [dbPath]: {
                $let: {
                    vars: {
                        currentFlags: { $ifNull: [`$${dbPath}`, []] }
                    },
                    in: queryPart
                }
            }
        }
    }]);
}

export function toggleFlag(user: User, flag: string): Promise<void>;
export function toggleFlag(guild: Guild, flag: string): Promise<void>;
export function toggleFlag(channel: GuildChannel, flag: string): Promise<void>;
export function toggleFlag(item: User | Guild | GuildChannel, flag: string): Promise<void>;
export async function toggleFlag(item: User | Guild | GuildChannel, flag: string) {
    return updateFlags(item, createToggleFlagPart(flag));
}

export function setFlag(user: User, flag: string): Promise<void>;
export function setFlag(guild: Guild, flag: string): Promise<void>;
export function setFlag(channel: GuildChannel, flag: string): Promise<void>;
export function setFlag(item: User | Guild | GuildChannel, flag: string): Promise<void>;
export async function setFlag(item: User | Guild | GuildChannel, flag: string) {
    return updateFlags(item, createAddFlagPart(flag));
}

export function removeFlag(user: User, flag: string): Promise<void>;
export function removeFlag(guild: Guild, flag: string): Promise<void>;
export function removeFlag(channel: GuildChannel, flag: string): Promise<void>;
export function removeFlag(item: User | Guild | GuildChannel, flag: string): Promise<void>;
export async function removeFlag(item: User | Guild | GuildChannel, flag: string) {
    return updateFlags(item, createRemoveFlagPart(flag));
}
