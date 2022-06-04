/**
 * @file Keeps global bot state.
 */

import { readFileSync } from "fs";
import { Client, GatewayIntentBits, Guild, IntentsBitField, Partials, Snowflake, Team, User } from "discord.js";
import { UserDataManager } from "./modules/data/UserDataManager";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { MusicPlayer } from "./modules/music/MusicPlayer";
import { ChannelLink, FlagData, InviteTrackerData, LanguageData, PermissionData, TextGenData } from "./modules/data/models";

export const version: string = JSON.parse(readFileSync("./package.json", "utf8")).version;
export const botDirectory = fileURLToPath(dirname(import.meta.url));

export const {
    isDebug,
    token,
    prefix: defaultPrefix
}: {
    isDebug: boolean,
    token: string,
    prefix: string
} = JSON.parse(readFileSync("./config.json", "utf8"));

export const client = new Client({
    intents: Object.values(IntentsBitField.Flags) as GatewayIntentBits[],
    partials: [Partials.Channel],
    presence: {
        activities: [{
            name: `v${version}${isDebug ? "-dev" : ""}`
        }]
    }
});

export function isBotOwner(user: User) {
    if (client.application?.owner) return false;

    return client.application.owner.id === user.id
        || (client.application.owner as Team).members?.map(x => x.user).includes(user)
        || data.users[user.id].flags.includes("owner");
}

export const dataManager = new UserDataManager("./data", {
    guilds: {
        fileType: "object",
        object: {} as {
            prefix: string,
            inviteTracker: InviteTrackerData,

            roles: Record<string, PermissionData>,
            members: Record<string, PermissionData>,
            channels: Record<string, {
                link: ChannelLink;
            } & FlagData & TextGenData>,
        } & LanguageData & FlagData
    },
    users: {
        fileType: "object",
        object: {} as LanguageData & FlagData & PermissionData
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
    ...isDebug
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

if (isDebug)
    console.log("(Warn) Running in debug mode.");
