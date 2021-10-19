import { exec as _exec } from "child_process";
import { promisify } from "util";
import { skipStringAfter } from "../../util.js";
const exec = promisify(_exec);
import sendLongText from "../../modules/messages/sendLongText.js";
import { getPrefix } from "../../modules/commands/getPrefix.js";

/**
 * @param {import("discord.js").Message} msg
 */
async function shell(msg) {
    let command = skipStringAfter(msg.content,
        getPrefix(msg.guildId),
        // eslint-disable-next-line no-use-before-define
        name
    );
    let { stdout, stderr } = await exec(command, { encoding: "utf8" });

    if (stdout.length)
        await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
    if (stderr.length)
        await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
}

export const name = "shell";
export const minArgs = 1;
export const maxArgs = Infinity;
export const func = shell;
