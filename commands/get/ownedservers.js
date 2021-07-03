"use strict";

import { client } from "../../env.js";

async function getOwnedServers(msg) {
    let resp = "";

    for (let guild of client.guilds.cache.values()) {
        if (guild.ownerID !== client.user.id) continue;

        let channel = [...guild.channels.cache.values()].find(channel => channel.type === "text");
        let invite = await channel.createInvite();
        resp += invite.url + "\n";
    }

    if (resp !== "")
        await msg.channel.send(resp);

    return true;
}

export const name = "ownedservers";
export const description = "list bot test servers";
export const minArgs = 0;
export const maxArgs = 0;
export const func = getOwnedServers;
