/**
 * @file Keeps global bot state.
 */

import { Client, GatewayIntentBits, Guild, IntentsBitField, Partials, Snowflake, Team, User } from "discord.js";
import { User as DatabaseUser } from "./database/models";
import { MusicPlayer } from "./modules/music/MusicPlayer";
import { debug, version } from "./constants";

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
