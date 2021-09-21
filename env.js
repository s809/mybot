/**
 * @file Keeps global bot state.
 */

import { readFileSync } from "fs";
import { Client, Intents, Message } from "discord.js";
import { UserDataManager } from "./modules/data/UserDataManager.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

/** @type {string} */
export const version = JSON.parse(readFileSync("./package.json", "utf8")).version;
export const owner = "559800250924007434"; // NoNick
export const botDirectory = fileURLToPath(dirname(import.meta.url));

export var isDebug = false;
export var prefix = "!";

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

/**
 * Sets a new prefix for current bot process.
 * 
 * @param {string} newPrefix New prefix.
 */
export function setPrefix(newPrefix) {
    prefix = newPrefix;
}

/**
 * Enables debug mode.
 */
export function enableDebug() {
    console.log("(Warn) Running in debug mode.");
    isDebug = true;
}

/** @type {Map<import("discord.js").Guild, import("./commands/music/index.js").MusicPlayerEntry>} */
export const musicPlayingGuilds = new Map();
