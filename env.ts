/**
 * @file Keeps global bot state.
 */

import { Client, GatewayIntentBits, GuildTextBasedChannel, IntentsBitField, LocaleString, Message, Partials, Snowflake, Team, User } from "discord.js";
import { User as DbUser, Guild as DbGuild } from "./database/models";
import { MusicPlayer } from "./modules/music/MusicPlayer";
import { debug, version } from "./constants";
import { MapWithDefault } from "./modules/misc/MapWithDefault";
import { Command, CommandFramework } from "@s809/noisecord";
import { defaults } from "./constants";
import { getPrefix } from "./modules/data/getPrefix";

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

export const commandFramework = new CommandFramework({
    commandRegistryOptions: {
        commandModuleDirectory: "./build/commands",
        contextMenuModuleDirectory: "./build/contextMenuCommands"
    },
    translationOptions: {
        translationFileDirectory: "./translations",
        defaultLocale: defaults.locale,
        getUserLocale: async user => (await DbUser.findByIdOrDefault(user.id, { language: 1 })).language as LocaleString ?? null,
        getGuildLocale: async guild => (await DbGuild.findByIdOrDefault(guild.id, { language: 1 })).language as LocaleString ?? null
    },
    interactionCommands: {
        registerApplicationCommands: true
    },
    messageCommands: {
        prefix: msg => getPrefix(msg.guildId)
    }
});

export async function isBotOwner(user: User) {
    if (!client.application?.owner) return false;

    return client.application.owner.id === user.id
        || (client.application.owner as Team).members?.map(x => x.user).includes(user)
        || (await DbUser.findByIdOrDefault(user.id, { flags: 1 }))!.flags.includes("owner");
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
