import { readdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Imports modules in directory of {@link modulePath}.
 * Ignores index.js.
 * 
 * @param modulePath Path to module.
 * @returns Imported modules.
 */
export async function importModules<T>(modulePath: string): Promise<T[]> {
    const dir = dirname(modulePath);
    let modules = [];

    for (let entry of (await readdir(fileURLToPath(dir), { withFileTypes: true }))) {
        if (!entry.isDirectory() && (entry.name === "index.js" || !entry.name.endsWith(".js")))
            continue;

        modules.push(import(`${dir}/${entry.name}`).then(m => m.default));
    }

    return Promise.all(modules);
}
