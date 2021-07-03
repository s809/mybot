"use strict";

import { execSync } from "child_process";

async function restart(msg) {
    execSync("git pull && npm i && ./mybot.sh");
    return true;
}

export const name = "restart";
export const func = restart;
