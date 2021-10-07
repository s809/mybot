"use strict";

import { client } from "../../env.js";

async function delAllServers() {
    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerId !== client.user.id) continue;

        await guild.delete();
    }
}

export const name = "delall";
export const description = "delete all test servers";
export const func = delAllServers;
