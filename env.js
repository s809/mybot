/**
 * @file Keeps global bot state.
 */

import { readFileSync } from "fs";
import { Client, Intents } from "discord.js";
import { UserDataManager } from "./modules/data/UserDataManager.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

/** @type {string} */
export const version = JSON.parse(readFileSync("./package.json", "utf8")).version;
export const botDirectory = fileURLToPath(dirname(import.meta.url));

const config = JSON.parse(readFileSync("./config.json", "utf8"));

export const {
    isDebug,
    token,
    owner,
    prefix: defaultPrefix
} = config;

export const client = new Client({
    intents: Object.values(Intents.FLAGS),
    partials: ["CHANNEL"]
});
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

/** @type {Map<import("discord.js").Guild, import("./commands/music/index.js").MusicPlayerEntry>} */
export const musicPlayingGuilds = new Map();

if (isDebug)
    console.log("(Warn) Running in debug mode.");
