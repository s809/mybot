import { readdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { isDebug } from "../../env.js";

function makeSubCommands(modules) {
    let map = new Map();

    for (let module of modules)
        map.set(module.name, module);

    return map;
}

export async function importCommands(modulePath) {
    let dir = fileURLToPath(dirname(modulePath));
    let modules = [];

    for (let entry of (await readdir(dir, { withFileTypes: true }))
        .filter(entry => entry.name !== "index.js")) {
        if (isDebug)
            console.log(`${dir}/${entry.name}${entry.isDirectory() ? `/index.js` : ""}`);
        
        modules.push(await import(`${dir}/${entry.name}${entry.isDirectory() ? `/index.js` : ""}`));
    }

    return makeSubCommands(modules);
}
