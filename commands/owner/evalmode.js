import assert from "assert";
import { data } from "../../env.js";
import { toggleFlag } from "../../modules/data/flags.js";

/**
 * 
 * @param {import("discord.js").Message} msg 
 * @returns 
 */
async function evalMode(msg) {
    if (!msg.guild) {
        msg.channel.send("Eval mode is enabled by default in DMs.");
        return false;
    }

    let channel = data.guilds[msg.guild.id].channels[msg.channel.id];
    assert(channel);

    toggleFlag(channel, "evalmode");

    return true;
}

export const name = "evalmode";
export const func = evalMode;
