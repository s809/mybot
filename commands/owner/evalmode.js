"use strict";

import { evalModeChannels } from "../../env.js";

async function evalMode(msg) {
    if (!evalModeChannels.includes(msg.channel))
        evalModeChannels.push(msg.channel);
    else
        evalModeChannels.splice(evalModeChannels.indexOf(msg.channel));
    return true;
}

export const name = "evalmode";
export const func = evalMode;
