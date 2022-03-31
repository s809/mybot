import { readdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { isDebug } from "../../env";
import { Command } from "./definitions";

/**
 * Converts modules to a map keyed by command names.
 * 
 * @param modules Array of modules.
 * @returns Map with command names as keys.
 */
function makeSubCommands(modules: any[]): Map<string, Command> {
    let map = new Map();

    for (let module of modules)
        map.set(module.name, module);

    return map;
}

/**
 * Imports modules in directory of {@link modulePath} as child commands.
 * Ignores index.js.
 * 
 * @param modulePath Path to module.
 * @returns Imported commands.
 */
export async function importCommands(modulePath: string) {
    let dir = dirname(modulePath);
    let modules = [];

    for (let entry of (await readdir(fileURLToPath(dir), { withFileTypes: true }))
        .filter(entry =>
            entry.name !== "index.js" && entry.name.endsWith(".js")
            || entry.isDirectory())) {
        if (isDebug)
            console.log(`${dir}/${entry.name}`);

        modules.push({
            ...(await import(`${dir}/${entry.name}`)).default
        });
    }

    return makeSubCommands(modules);
}
