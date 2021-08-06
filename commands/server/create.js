"use strict";

import { Message, Permissions, TextChannel } from "discord.js";
import { client } from "../../env.js";

/**
 * @param {Message} msg
 */
async function createServer(msg) {
    let guild = await client.guilds.create("testGuild", {
        icon: client.user.displayAvatarURL(),
        defaultMessageNotifications: "MENTIONS",
        channels: [{
            name: "general"
        }, {
            name: "general-2"
        }],
        roles: [{
            id: 0,
            permissions: Permissions.ALL
        }]
    });

    /** @type {TextChannel} */
    let channel = [...guild.channels.cache.values()].find(channel => channel instanceof TextChannel);
    let invite = await channel.createInvite();
    await msg.channel.send(invite.url);
    return true;
}

export const name = "create";
export const description = "create test server";
export const func = createServer;
