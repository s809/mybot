import { exec as _exec } from "child_process";
const exec = promisify(_exec);
import { promisify } from "util";
import { skipStringAfter } from "../../util";
import sendLongText from "../../modules/messages/sendLongText";
import { Message } from "discord.js";
import { getPrefix } from "../../modules/data/getPrefix";
import { Command } from "../../modules/commands/definitions";

async function shell(msg: Message) {
    let command = skipStringAfter(msg.content,
        getPrefix(msg.guildId),
        shell.name
    );
    let { stdout, stderr } = await exec(command, { encoding: "utf8" });

    if (stdout.length)
        await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
    if (stderr.length)
        await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
}

const command: Command = {
    name: "shell",
    args: [1, Infinity, "<code...>"],
    func: shell
};
export default command;
