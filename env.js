/**
 * @file Keeps global bot state.
 */
"use strict";

import { readFileSync } from "fs";
import { Guild, Channel, Client, Message } from "discord.js";
import disbut from "discord-buttons";
import ChannelData from "./ChannelData.js";

/** @type {string} */
export const version = JSON.parse(readFileSync("./package.json", "utf8")).version;
export var prefix = "!";
export const owner = "559800250924007434"; // NoNick
export const maxVersionsOnChangelogPage = 10;
export const client = new Client();
disbut(client);
export const channelData = new ChannelData(`./data.db`);

/** @type {Map<Channel, Channel>} */
export const pendingClones = new Map();

/** @type {Map<Channel, Message[]>} */
export const messageBuffers = new Map();

/** @type {Channel[]} */
export const evalModeChannels = [];

/**
 * Sets a new prefix for current bot process.
 * 
 * @param {string} newPrefix New prefix.
 * @example setPrefix("t!");
 */
export function setPrefix(newPrefix)
{
    prefix = newPrefix;
}

/** @type {Map<Guild, import("./commands/music/index.js").MusicPlayerEntry>} */
export const musicPlayingGuilds = new Map();
