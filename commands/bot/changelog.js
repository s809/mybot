/**
 * @file Changelog command.
 */
"use strict";

import { execSync } from "child_process";
import { sendLongText } from "../../sendUtil.js";
import Discord from "discord.js";
import { version as currentVersion } from "../../env.js";

/**
 * Prepares bot changelog based on Git commits.
 * 
 * @returns {string} Changelog text.
 */
function prepareChangelog() {
    let commitCount = parseInt(execSync("git rev-list --count HEAD", { encoding: "utf8" }));

    let str = `${currentVersion}:\n`;
    let lastVersion = currentVersion;
    let lastMessage = "";

    for (let i = 0; i < commitCount; i++) {
        let hardVersion, packageVersion;
        try
        {
            hardVersion = execSync(`git grep --only-matching "\\"v.*\\"" HEAD~${i} -- main.js env.js`, { encoding: "utf8" })
                .split("\"")[1]
                .substr(1);
        }
        catch {
            hardVersion = "";
        }
        
        try {
            packageVersion = execSync(`git grep --only-matching "version.*\\".*\\"" HEAD~${i} -- package.json`, { encoding: "utf8" })
                .split("\"")[2];
        } catch {
            packageVersion = "";
        }
        
        let version = hardVersion > packageVersion ? hardVersion : packageVersion;
        let msg = execSync(`git log -1 HEAD~${i} --format=%B`, { encoding: "utf8" });

        if (version !== lastVersion) {
            if (lastVersion !== currentVersion)
            {
                if (lastVersion !== "")
                    str += "\n";

                str += lastVersion + ":\n";
            }
            lastVersion = version;
        }

        str += lastMessage;
        lastMessage = msg.substr(0, msg.length - 1);
    }
    str += `\n${lastVersion}\n${lastMessage.substr(0, lastMessage.length - 1)}`;

    return str;
}

const logstr = prepareChangelog();

/**
 * Sends a message with changelog.
 * 
 * @param {Discord.Message} msg Message a command was sent from.
 * @returns {boolean} Whether the execution was successful.
 */
async function changelog(msg) {
    await sendLongText(msg.channel, logstr, null);
    return true;
}

export const name = "changelog";
export const description = "get bot changelog";
export const minArgs = 0;
export const maxArgs = 0;
export const func = changelog;
