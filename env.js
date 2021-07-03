"use strict";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { Client } from "discord.js";
import ChannelData from "./ChannelData.js";

export var prefix = "!";
export const owner = "559800250924007434"; // NoNick
export const maxVersionsOnChangelogPage = 10;
export const client = new Client();
export const channelData = new ChannelData(`${dirname(fileURLToPath(import.meta.url))}/data.db`); // jshint ignore: line
export const pendingClones = new Map();
export const messageBuffers = new Map();
export const evalModeChannels = [];
export function setPrefix(newPrefix)
{
    prefix = newPrefix;
}
