import { exec as _exec } from "child_process";
const exec = promisify(_exec);
import { promisify } from "util";
import sendLongText from "../../modules/messages/sendLongText";
import { ApplicationCommandOptionType } from "discord.js";
import { defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "shell",
    args: [{
        key: "command",
        type: ApplicationCommandOptionType.String,
        raw: true
    }],

    handler: async (msg, { command }) => {
        let { stdout, stderr } = await exec(command, { encoding: "utf8" });
    
        if (stdout.length)
            await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
        if (stderr.length)
            await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
    }
});
