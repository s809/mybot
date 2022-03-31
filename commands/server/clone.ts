import { CategoryChannel, GuildBasedChannel, GuildChannel, GuildTextBasedChannel, Message, NewsChannel, Role, Snowflake, StageChannel, StoreChannel, TextBasedChannel, ThreadChannel, VoiceChannel } from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";
import { client } from "../../env";
import { Command } from "../../modules/commands/definitions";

async function cloneServer(msg: Message, fromGuildStr: Snowflake, mode: string) {
    let fromGuild = client.guilds.resolve(fromGuildStr);

    let channels = new Map();
    let roles = new Map();

    // Roles
    /** @type {Role} */
    let role: Role;
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
    let channel: GuildChannel;
    let didSkipChannels = false;
    try {
        if (mode === "both" || mode === "channels") {
            // Categories
            for (let channel of [...fromGuild.channels.cache.values()]
                .filter(x => x instanceof CategoryChannel)
                .sort((x: CategoryChannel, y: CategoryChannel) => x.position - y.position) as CategoryChannel[]) {
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
            for (let channel of [...fromGuild.channels.cache.values()]
                .filter(x => !(x instanceof CategoryChannel) && !(x instanceof ThreadChannel))
                .sort((
                    x: Exclude<GuildBasedChannel, CategoryChannel | ThreadChannel>,
                    y: Exclude<GuildBasedChannel, CategoryChannel | ThreadChannel>
                ) =>
                    (x.position ?? 0) - (y.position ?? 0)
                ) as Exclude<GuildBasedChannel, CategoryChannel | ThreadChannel>[]) {

                try {
                    await msg.guild.channels.create(channel.name, {
                        type: channel.type,
                        topic: (channel as Exclude<typeof channel, StoreChannel | VoiceChannel>).topic,
                        nsfw: (channel as Exclude<typeof channel, StageChannel | VoiceChannel>).nsfw,
                        bitrate: (channel as Exclude<typeof channel, TextBasedChannel | StoreChannel>).bitrate,
                        userLimit: (channel as Exclude<typeof channel, TextBasedChannel | StoreChannel>).userLimit,
                        rateLimitPerUser: (channel as Exclude<typeof channel, VoiceChannel | NewsChannel | StageChannel | StoreChannel>).rateLimitPerUser,
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

const command: Command = {
    name: "clone",
    args: [2, 2, "<id> <mode{channels,roles,both}>"],
    func: cloneServer
};
export default command;
