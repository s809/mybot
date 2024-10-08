/**
 * @file Module for config and auto-generated constant values.
 */

import { readFileSync } from "fs";
import { LocaleString, Snowflake } from "discord.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

export const version: string = JSON.parse(readFileSync("./package.json", "utf8")).version;
export const botDirectory = fileURLToPath(dirname(import.meta.url));

export const {
    debug = false,
    token,
    logChannel,
    defaults,
    voice,
    oauth2
}: {
    debug: boolean;
    token: string;
    logChannel: Snowflake;
    defaults: Readonly<{
        locale: LocaleString;
        prefix: string;
    }>;
    voice: Readonly<{
        readyWaitTimeout: number;
        playingWaitTimeout: number;
        nextTrackDelay: number;
        pauseResumeTimeout: number;
    }>;
    oauth2: Readonly<{
        port: number;
        clientSecret: string;
        cookieSecret: string;
        urlBase: string;
    }> | null
} = JSON.parse(readFileSync("./config.json", "utf8"));
