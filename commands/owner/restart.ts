/**
 * @file Restart command.
 */
import { execSync } from "child_process";
import { Message } from "discord.js";
import { data, isDebug } from "../../env";
import { Command } from "../../modules/commands/definitions";

async function restart(msg: Message) {
    data.saveDataSync();

    if (!isDebug)
        execSync("git pull && npm install");
    if (process.argv.includes("--started-by-script"))
        execSync("./mybot.sh --nokill");

    await msg.react("✅");
    process.exit();
}

const command: Command = {
    name: "restart",
    func: restart
};
export default command;
