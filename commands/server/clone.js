const env = require("../../env.js");

async function cloneServer(msg, fromGuild, mode) {
    fromGuild = env.client.guilds.resolve(fromGuild);

    let channels = new Map();
    let roles = new Map();

    if (mode === "both" || mode === "roles") {
        for (let role of [...fromGuild.roles.cache.values()].filter(x => !x.managed).sort((x, y) => y.position - x.position)) {
            if (role.id === fromGuild.roles.everyone.id) continue;

            roles.set(role, await msg.guild.roles.create({
                data:
                {
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    mentionable: role.mentionable
                }
            }));
        }

        roles.set(fromGuild.roles.everyone, msg.guild.roles.everyone);
    }

    if (mode === "both" || mode === "channels") {
        for (let channel of [...fromGuild.channels.cache.values()].filter(x => x.type === "category").sort((x, y) => x.position - y.position)) {
            channels.set(channel, await msg.guild.channels.create(channel.name,
                {
                    type: channel.type,
                    permissionOverwrites: roles.size === 0 ? undefined : Array.from([...channel.permissionOverwrites.values()].filter(x => x.type === "role" && roles.has(fromGuild.roles.resolve(x.id))), x => {
                        let y = {
                            id: roles.get(fromGuild.roles.resolve(x.id)),
                            allow: x.allow,
                            deny: x.deny,
                            type: "role"
                        };
                        return y;
                    })
                }));
        }

        for (let channel of [...fromGuild.channels.cache.values()].filter(x => x.type !== "category").sort((x, y) => x.position - y.position)) {
            await msg.guild.channels.create(channel.name,
                {
                    type: channel.type,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    bitrate: channel.bitrate,
                    userLimit: channel.userLimit,
                    rateLimitPerUser: channel.rateLimitPerUser,
                    parent: channels.get(channel.parent),
                    permissionOverwrites: roles.size === 0 ? undefined : Array.from([...channel.permissionOverwrites.values()].filter(x => x.type === "role" && roles.has(fromGuild.roles.resolve(x.id))), x => {
                        let y = {
                            id: roles.get(fromGuild.roles.resolve(x.id)),
                            allow: x.allow,
                            deny: x.deny,
                            type: "role"
                        };
                        return y;
                    })
                });
        }
    }

    return true;
}

module.exports =
{
    name: "clone",
    description: "clone all channels and/or roles from another server",
    args: "<id> <mode{channels,roles,both}>",
    minArgs: 2,
    maxArgs: 2,
    func: cloneServer,
}