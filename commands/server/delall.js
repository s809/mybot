"use strict";

import { client } from "../../env.js";

function delAllServers() {
    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerID !== client.user.id) continue;

        guild.delete();
    }
    return true;
}

export const name = "delall";
export const description = "delete all test servers";
export const func = delAllServers;
