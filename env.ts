/**
 * @file Keeps global bot state.
 */

import { readFileSync } from "fs";
import { Client, GatewayIntentBits, Guild, IntentsBitField, Partials, Snowflake, Team, User } from "discord.js";
import { UserDataManager } from "./modules/data/UserDataManager";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { MusicPlayer } from "./modules/music/MusicPlayer";
import { FlagData, InviteTrackerData, LanguageData, PermissionData, TextGenData } from "./modules/data/models";
import { logDebug } from "./log";

export const version: string = JSON.parse(readFileSync("./package.json", "utf8")).version;
export const botDirectory = fileURLToPath(dirname(import.meta.url));

export const {
    debug,
    token,
    logChannel,
    prefix: defaultPrefix
}: {
    debug: boolean,
    token: string,
    logChannel: Snowflake,
    prefix: string
} = JSON.parse(readFileSync("./config.json", "utf8"));

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

export function isBotOwner(user: User) {
    if (!client.application?.owner) return false;

    return client.application.owner.id === user.id
        || (client.application.owner as Team).members?.map(x => x.user).includes(user)
        || data.users[user.id].flags.includes("owner");
}

export const dataManager = new UserDataManager("./data", {
    guilds: {
        fileType: "object",
        object: <{
            prefix: string,
            inviteTracker?: InviteTrackerData,

            roles: Record<string, PermissionData>,
            members: Record<string, PermissionData>,
            channels: Record<string, FlagData & TextGenData>,
        } & LanguageData & FlagData>{}
    },
    users: {
        fileType: "object",
        object: <LanguageData & FlagData & PermissionData>{}
    },
    scripts: {
        children: {
            startup: {
                fileType: "string"
            },
            callable: {
                fileType: "string"
            }
        }
    }
});
export const data = dataManager.root;

export const voiceTimeouts = {
    ...debug
        ? {
            voiceReady: 15000,
            playerPlaying: 30000,
        }
        : {
            voiceReady: 5000,
            playerPlaying: 10000,
        },
    playerIdle: 3000,
    paused: 120000
};

export const musicPlayingGuilds = new Map<Guild, MusicPlayer>();
export const storedInviteCounts = new Map<Snowflake, Map<string, number>>();

logDebug("Running in debug mode.");
