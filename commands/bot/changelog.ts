/**
 * @file Changelog command.
 */
import { execSync } from "child_process";
import sendLongText from "../../modules/messages/sendLongText";
import Discord, { EmbedBuilder } from "discord.js";
import { version as currentVersion, isDebug } from "../../env";
import { Translator } from "../../modules/misc/Translator";
import { Command } from "../../modules/commands/definitions";

/**
 * Prepares bot changelog based on Git commits.
 * 
 * @returns Changelog text.
 */
function prepareChangelog() {
    if (isDebug)
        return "*Changelog is not generated in debug mode.*";

    console.log("Preparing changelog...");

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
                hardVersion = undefined;
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

    console.log("Finished.");
    return str;
}

const logstr = prepareChangelog();

/**
 * Sends a message with changelog.
 * 
 * @param msg Message a command was sent from.
 */
async function changelog(msg: Discord.Message) {
    await sendLongText(msg.channel, logstr, {
        code: null,
        embed: new EmbedBuilder({
            title: Translator.get(msg).translate("embeds.bot_changelog.title")
        })
    });
}

const command: Command = {
    name: "changelog",
    func: changelog,
};
export default command;
