import { exec, execSync } from "child_process";
import { Awaitable } from "discord.js";
import { promisify } from "util";
import { database } from "../../database";
import { debug } from "../../constants";

export async function doRestart(callback?: () => Awaitable<void>) {
    if (!debug)
        await promisify(exec)("git pull && npm install");
    
    await callback?.();

    await database.disconnect();
    if (process.argv.includes("--started-by-script"))
        execSync("./mybot.sh --nokill");
    process.exit();
}
