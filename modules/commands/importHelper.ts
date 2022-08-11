import { readdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { CommandDefinition } from "./definitions";

/**
 * Imports modules in directory of {@link modulePath} as child commands.
 * Ignores index.js.
 * 
 * @param modulePath Path to module.
 * @returns Imported commands.
 */
export async function importCommands(modulePath: string): Promise<CommandDefinition[]> {
    const dir = dirname(modulePath);
    let modules = [];

    for (let entry of (await readdir(fileURLToPath(dir), { withFileTypes: true }))) {
        if (!entry.isDirectory() && (entry.name === "index.js" || !entry.name.endsWith(".js")))
            continue;

        modules.push(import(`${dir}/${entry.name}`).then(m => m.default));
    }

    return Promise.all(modules);
}
