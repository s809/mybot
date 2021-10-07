"use strict";

import { CategoryChannel, Guild, GuildChannel, Message, MessageActionRow, MessageButton, Role, ThreadChannel } from "discord.js";
import { client } from "../../env.js";

/**
 * @param {Message} msg
 * @param {import("discord.js").Snowflake | Guild} fromGuild
 * @param {string} mode
 */
async function cloneServer(msg, fromGuild, mode) {
    fromGuild = client.guilds.resolve(fromGuild);

    let channels = new Map();
    let roles = new Map();

    // Roles
    /** @type {Role} */
    let role;
    try {
        if (mode === "both" || mode === "roles") {
            for (role of [...fromGuild.roles.cache.values()].filter(x => !x.managed).sort((x, y) => y.position - x.position)) {
                if (role.id === fromGuild.roles.everyone.id) continue;

                roles.set(role, await msg.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    mentionable: role.mentionable
                }));
            }

            roles.set(fromGuild.roles.everyone, msg.guild.roles.everyone);
        }
    }
    catch (e) {
        e.message += `\nRole: ${role.id}`;
        throw e;
    }

    /** @type {GuildChannel} */
    let channel;
    let didSkipChannels = false;
    try {
        if (mode === "both" || mode === "channels") {
            // Categories
            for (channel of [...fromGuild.channels.cache.values()]
                .filter(x => x instanceof CategoryChannel)
                .sort((x, y) => x.position - y.position)) {
                channels.set(channel, await msg.guild.channels.create(channel.name, {
                    type: channel.type,
                    permissionOverwrites: roles.size === 0
                        ? undefined
                        : [...channel.permissionOverwrites.cache.values()]
                            .filter(role => role.type === "role" && roles.has(fromGuild.roles.resolve(role.id)))
                            .map(srcRole => ({
                                id: roles.get(fromGuild.roles.resolve(srcRole.id)),
                                allow: srcRole.allow,
                                deny: srcRole.deny,
                                type: "role"
                            }))

                }));
            }

            // Normal channels
            for (channel of [...fromGuild.channels.cache.values()]
                .filter(x => !(x instanceof CategoryChannel))
                .sort((x, y) => (x.position ?? 0) - (y.position ?? 0))) {
                if (channel instanceof ThreadChannel) continue;

                try {
                    await msg.guild.channels.create(channel.name, {
                        type: channel.type,
                        topic: channel.topic,
                        nsfw: channel.nsfw,
                        bitrate: channel.bitrate,
                        userLimit: channel.userLimit,
                        rateLimitPerUser: channel.rateLimitPerUser,
                        parent: channels.get(channel.parent),
                        permissionOverwrites: roles.size === 0
                            ? undefined
                            : [...channel.permissionOverwrites.cache.values()]
                                .filter(role => role.type === "role" && roles.has(fromGuild.roles.resolve(role.id)))
                                .map(srcChannel => ({
                                    id: roles.get(fromGuild.roles.resolve(srcChannel.id)),
                                    allow: srcChannel.allow,
                                    deny: srcChannel.deny,
                                    type: "role"
                                }))
                    });
                }
                catch (e) {
                    if (e.message === "Cannot execute action on this channel type") {
                        didSkipChannels = true;
                        continue;
                    }
                    throw e;
                }
            }
        }
    }
    catch (e) {
        e.message += `\nChannel: ${channel.id}`;
        throw e;
    }

    if (didSkipChannels)
        await msg.channel.send("Some channels were skipped as this server is not community-enabled.");
}

export const name = "clone";
export const description = "clone all channels and/or roles from another server";
export const args = "<id> <mode{channels,roles,both}>";
export const minArgs = 2;
export const maxArgs = 2;
export const func = cloneServer;
