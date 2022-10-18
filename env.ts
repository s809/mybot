/**
 * @file Keeps global bot state.
 */

import { Client, GatewayIntentBits, Guild, GuildResolvable, IntentsBitField, Partials, Snowflake, Team, User } from "discord.js";
import { User as DatabaseUser } from "./database/models";
import { MusicPlayer } from "./modules/music/MusicPlayer";
import { debug, version } from "./constants";
import { Command } from "./modules/commands/definitions";

export const client = new Client({
    intents: Object.values(IntentsBitField.Flags) as GatewayIntentBits[],
    partials: [Partials.Channel],
    presence: {
        activities: [{
            name: debug
                ? `v${version.split("-")[0]}-dev`
                : `v${version}`,
        }]
    }
});

export async function isBotOwner(user: User) {
    if (!client.application?.owner) return false;

    return client.application.owner.id === user.id
        || (client.application.owner as Team).members?.map(x => x.user).includes(user)
        || (await DatabaseUser.findByIdOrDefault(user.id, { flags: 1 }))!.flags.includes("owner");
}

export const musicPlayingGuilds = new Map<Guild, MusicPlayer>();
export const storedInviteCounts = new Map<Snowflake, Map<string, number>>();
export const textGenEnabledChannels = new Set<string>();

const runtimeGuildData = new Map<Snowflake, {
    musicPlayer?: MusicPlayer,
    inviteCounts?: Map<string, number>,

    channels: Map<Snowflake, {
        textGenEnabled?: true,

        members: Map<Snowflake, {
            lastCommand?: {
                command: Command,
                args: object
            },
            messageSelectionRange?: {
                begin: Snowflake,
                end: Snowflake,
            }
        }>
    }>
}>;
export function getRuntimeGuildData(guild: GuildResolvable) {
    const resolved = client.guilds.resolveId(guild);
    if (!resolved)
        throw new Error("Invalid guild");

    return runtimeGuildData.getOrSet(resolved, {
        channels: new Map()
    });
}
