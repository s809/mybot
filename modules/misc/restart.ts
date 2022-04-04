import { execSync } from "child_process";
import { Awaitable, Message } from "discord.js";
import { data, isDebug } from "../../env";

export async function doRestart(callback?: () => Awaitable<void>) {
    data.saveDataSync();

    if (!isDebug)
        execSync("git pull && npm install");
    if (process.argv.includes("--started-by-script"))
        execSync("./mybot.sh --nokill");
    
    await callback();
    process.exit();
}
