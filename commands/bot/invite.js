"use strict";

import { Permissions } from "discord.js";
import { client } from "../../env.js";

async function botInvite(msg) {
    await msg.channel.send(client.generateInvite({
        scopes: ["bot"],
        permissions: Permissions.ALL
    }));
}

export const name = "invite";
export const description = "get bot server invite link";
export const minArgs = 0;
export const maxArgs = 0;
export const func = botInvite;
