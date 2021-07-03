"use strict";

import { pendingClones } from "../../env.js";

async function stopBatchClone(msg) {
    if (!pendingClones.has(msg.channel)) {
        msg.channel.send("Clone is not pending.");
        return false;
    }

    pendingClones.delete(pendingClones.get(msg.channel));
    pendingClones.delete(msg.channel);
    return true;
}

export const name = "stop";
export const description = "stop pending clone operation";
export const func = stopBatchClone;
