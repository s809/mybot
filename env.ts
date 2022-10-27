/**
 * @file Keeps global bot state.
 */

import { Client, GatewayIntentBits, GuildTextBasedChannel, IntentsBitField, Message, Partials, Snowflake, Team, User } from "discord.js";
import { User as DatabaseUser } from "./database/models";
import { MusicPlayer } from "./modules/music/MusicPlayer";
import { debug, version } from "./constants";
import { Command } from "./modules/commands/definitions";
import { MapWithDefault } from "./modules/misc/MapWithDefault";

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

export const runtimeGuildData = new MapWithDefault<Snowflake, {
    musicPlayer?: MusicPlayer,
    inviteTracker?: {
        logChannel: GuildTextBasedChannel,
        counts: Map<string, number>,
    },

    channels: MapWithDefault<Snowflake, {
        textGenEnabled?: boolean,
        pinnedMessageUpdater?: (msg: Message) => void,

        members: MapWithDefault<Snowflake, {
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
}>()
    .setDefault(() => ({
        channels: new MapWithDefault()
            .setDefault(() => ({
                members: new MapWithDefault()
                    .setDefault(() => ({}))
            }))
    }));
