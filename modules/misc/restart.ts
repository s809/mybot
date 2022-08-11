import { exec, execSync } from "child_process";
import { Awaitable } from "discord.js";
import { promisify } from "util";
import { dataManager, debug } from "../../env";

export async function doRestart(callback?: () => Awaitable<void>) {
    if (!debug)
        await promisify(exec)("git pull && npm install");
    
    await callback?.();

    dataManager.saveDataSync();
    if (process.argv.includes("--started-by-script"))
        execSync("./mybot.sh --nokill");
    process.exit();
}
