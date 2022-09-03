/**
 * @file Changelog command.
 */
import { execSync } from "child_process";
import sendLongText from "../../modules/messages/sendLongText";
import { EmbedBuilder } from "discord.js";
import { version as currentVersion, debug } from "../../env";
import { CommandDefinition } from "../../modules/commands/definitions";
import { log } from "../../log";
import { CommandMessage } from "../../modules/commands/CommandMessage";

/**
 * Prepares bot changelog based on Git commits.
 * 
 * @returns Changelog text.
 */
function prepareChangelog() {
    if (debug)
        return "*Changelog is not generated in debug mode.*";

    log("Preparing changelog...");

    let commitCount = parseInt(execSync("git rev-list --count HEAD", { encoding: "utf8" }));

    let str = `${currentVersion}:\n`;
    let lastVersion = currentVersion;
    let lastMessage = "";

    for (let i = 0; i < commitCount; i++) {
        let hardVersion, packageVersion;
        try {
            hardVersion = execSync(`git grep --only-matching "\\"v.*\\"" HEAD~${i} -- main.js env.js`, { encoding: "utf8" })
                .split("\"")[1]
                .slice(1);

            if (!hardVersion.match(/\d(\.\d)+/))
                hardVersion = "";
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
            if (lastVersion !== currentVersion) {
                if (lastVersion !== "")
                    str += "\n";

                str += lastVersion + ":\n";
            }
            lastVersion = version;
        }

        str += lastMessage;
        lastMessage = msg.slice(0, -1);
    }
    str += `\n${lastVersion}:\n${lastMessage.slice(0, -1)}`;

    log("Finished.");
    return str;
}

const logstr = prepareChangelog();

/**
 * Sends a message with changelog.
 * 
 * @param msg Message a command was sent from.
 */
async function changelog(msg: CommandMessage) {
    await sendLongText(msg, logstr, {
        code: null,
        embed: new EmbedBuilder({
            title: msg.translator.translate("embeds.title")
        })
    });
}

const command: CommandDefinition = {
    key: "changelog",
    handler: changelog,
    usableAsAppCommand: false,
    ownerOnly: true
};
export default command;
