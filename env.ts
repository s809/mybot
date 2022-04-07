/**
 * @file Keeps global bot state.
 */

import { readFileSync } from "fs";
import { Client, Intents, Guild, Snowflake, Team, User } from "discord.js";
import { UserDataManager } from "./modules/data/UserDataManager";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { MusicPlayer } from "./modules/music/MusicPlayer";
import discordModals from "discord-modals";

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
    intents: Object.values(Intents.FLAGS),
    partials: ["CHANNEL"],
    presence: {
        activities: [{
            name: `v${version}${isDebug ? "-dev" : ""}`
        }]
    }
});
discordModals(client);

export function isBotOwner(user: User) {
    return client.application.owner.id === user.id
        || (client.application.owner as Team).members?.map(x => x.user).includes(user);
}

export const data = new UserDataManager("./data", {
    guilds: {
        fileType: "object"
    },
    users: {
        fileType: "object"
    },
    scripts: {
        startup: {
            fileType: "string"
        },
        callable: {
            fileType: "string"
        }
    }
});

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
