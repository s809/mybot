import { execSync } from "child_process";
import { Awaitable } from "discord.js";
import { dataManager, debug } from "../../env";

export async function doRestart(callback?: () => Awaitable<void>) {
    dataManager.saveDataSync();

    if (!debug)
        execSync("git pull && npm install");
    if (process.argv.includes("--started-by-script"))
        execSync("./mybot.sh --nokill");
    
    await callback();
    process.exit();
}
