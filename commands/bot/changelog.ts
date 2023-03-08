/**
 * @file Changelog command.
 */
import { execSync } from "child_process";
import sendLongText from "../../modules/messages/sendLongText";
import { EmbedBuilder } from "discord.js";
import { version as currentVersion, debug } from "../../constants";
import { defineCommand } from "@s809/noisecord";
import { log } from "../../log";
import { CommandRequest } from "@s809/noisecord";

/**
 * Prepares bot changelog based on Git commits.
 * 
 * @returns Changelog text.
 */
function prepareChangelog() {
    if (debug)
        return "*Changelog is not generated in debug mode.*";

    log("Preparing changelog...");

    const commitCount = parseInt(execSync("git rev-list --count HEAD", { encoding: "utf8" }));

    const messages: [string, string[]][] = [[currentVersion.split("-")[0], []]];
    let isHardVersion = false;
    for (let i = 0; i < commitCount; i++) {
        let version;

        if (!isHardVersion) {
            version = execSync(`git grep --only-matching "version.*\\".*\\"" HEAD~${i} -- package.json`, { encoding: "utf8" })
                .split("\"")[2]
                .split("-")[0];
            
            if (version === "1.0.0") {
                isHardVersion = true;
                i--;
                continue;
            }
        } else {
            version = execSync(`git grep --only-matching "\\"v.*\\"" HEAD~${i} -- main.js env.js`, { encoding: "utf8" })
                .split("\"")[1]
                .slice(1);
        }

        const message = execSync(`git log -1 HEAD~${i} --format=%B`, { encoding: "utf8" }).trim();

        const lastGroup = messages[messages.length - 1];
        if (version !== lastGroup[0])
            messages.push([version, [message]]);
        else
            lastGroup[1].push(message);
    }

    // Move post-release messages to next release
    for (const [i, [, list]] of messages.entries()) {
        if (i === 0) continue;
        messages[i - 1][1].push(...list.splice(0, list.length - 1));
    }

    log("Finished.");
    return messages.map(([version, list]) => [version, list.join("\n")].join(":\n")).join("\n\n");
}

const logstr = prepareChangelog();

/**
 * Sends a message with changelog.
 * 
 * @param msg Message a command was sent from.
 */
async function changelog(msg: CommandRequest) {
    await sendLongText(msg, logstr, {
        code: null,
        embed: new EmbedBuilder({
            title: msg.translator.translate("embeds.title")
        })
    });
}
;
export default defineCommand({
    key: "changelog",
    handler: changelog,
    interactionCommand: false,
    ownerOnly: true
});
