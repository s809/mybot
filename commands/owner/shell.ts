import { exec as _exec } from "child_process";
const exec = promisify(_exec);
import { promisify } from "util";
import { skipStringAfter } from "../../util";
import sendLongText from "../../modules/messages/sendLongText";
import { ApplicationCommandOptionType, Message } from "discord.js";
import { getPrefix } from "../../modules/data/getPrefix";
import { defineCommand, MessageCommandRequest } from "@s809/noisecord";
import { CommandRequest } from "@s809/noisecord";

async function shell(msg: MessageCommandRequest) {
    let command = skipStringAfter(msg.content,
        await getPrefix(msg.guildId),
        shell.name
    );
    let { stdout, stderr } = await exec(command, { encoding: "utf8" });

    if (stdout.length)
        await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
    if (stderr.length)
        await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
}

export default defineCommand({
    key: "shell",
    args: [{
        key: "command",
        type: ApplicationCommandOptionType.String,
        isExtras: true
    }],
    handler: shell
});
