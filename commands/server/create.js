"use strict";

import { Permissions } from "discord.js";
import { client } from "../../env.js";

async function createServer(msg) {
    let guild;
    try {
        guild = await client.guilds.create("testGuild",
            {
                icon: client.user.displayAvatarURL(),
                defaultMessageNotifications: "MENTIONS",
                channels: [
                    {
                        name: "general"
                    },
                    {
                        name: "general-2"
                    }],
                roles: [
                    {
                        id: 0,
                        permissions: Permissions.ALL
                    }]
            });
    }
    catch (e) {
        return false;
    }

    let channel = [...guild.channels.cache.values()].find(channel => channel.type === "text");
    let invite = await channel.createInvite();
    msg.channel.send(invite.url);
    return true;
}

export const name = "create";
export const description = "create test server";
export const func = createServer;
