"use strict";

const env = require("../../env");

async function evalMode(msg) {
    if (!env.evalModeChannels.includes(msg.channel))
        env.evalModeChannels.push(msg.channel);
    else
        env.evalModeChannels.splice(env.evalModeChannels.indexOf(msg.channel));
    return true;
}

module.exports = {
    name: "evalmode",
    minArgs: 0,
    maxArgs: 0,
    func: evalMode,
};
