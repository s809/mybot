"use strict";

import { execSync } from "child_process";
import { sendLongText } from "../../sendUtil.js";

function prepareChangelog() {
    let commitCount = parseInt(execSync("git rev-list --count HEAD", { encoding: "utf8" }));

    let str = "";
    let lastVersion = "";

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
            if (lastVersion !== "")
                str += "\n";

            lastVersion = version;
            str += version + ":\n";
        }

        str += msg.substr(0, msg.length - 1);
    }

    return str;
}

const logstr = prepareChangelog();

async function changelog(msg) {
    await sendLongText(msg.channel, logstr);
    return true;
}

export const name = "changelog";
export const description = "get bot changelog";
export const minArgs = 0;
export const maxArgs = 0;
export const func = changelog;
