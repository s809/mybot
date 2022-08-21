import { exec as _exec } from "child_process";
const exec = promisify(_exec);
import { promisify } from "util";
import { skipStringAfter } from "../../util";
import sendLongText from "../../modules/messages/sendLongText";
import { ApplicationCommandOptionType, Message } from "discord.js";
import { getPrefix } from "../../modules/data/getPrefix";
import { CommandDefinition } from "../../modules/commands/definitions";
import { CommandMessage } from "../../modules/commands/appCommands";

async function shell(msg: CommandMessage) {
    let command = skipStringAfter(msg.content,
        getPrefix(msg.guildId),
        shell.name
    );
    let { stdout, stderr } = await exec(command, { encoding: "utf8" });

    if (stdout.length)
        await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
    if (stderr.length)
        await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
    if (!stdout.length && !stderr.length) {
        if (msg.interaction)
            await msg.ignore();
        else
            await msg.message!.react("✅").catch(() => { });
    }
}

const command: CommandDefinition = {
    key: "shell",
    args: [{
        translationKey: "command",
        type: ApplicationCommandOptionType.String,
    }],
    handler: shell
};
export default command;
