import { ApplicationCommandOptionType, CategoryChannel, GuildChannel, GuildTextBasedChannel, NonThreadGuildBasedChannel, OverwriteType, Role, Snowflake, TextChannel, ThreadChannel, VoiceBasedChannel } from "discord.js";
import { client } from "../../env";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function cloneServer(msg: CommandRequest<true>, {
    id: guildId,
    mode,
    cleanBeforeStarting
}: {
    id: Snowflake;
    mode: string;
    cleanBeforeStarting: boolean;
}) {
    let guild = await client.guilds.fetch(guildId);

    if (cleanBeforeStarting) {
        if (mode === "both" || mode === "channels") {
            for (const channel of msg.guild.channels.cache.values())
                await channel.delete();
        }
        
        if (mode === "both" || mode === "roles") {
            for (const role of msg.guild.roles.cache.values()) {
                if (role !== msg.guild.roles.everyone)
                    await role.delete();
            }
        }
    }

    let channels = new Map();
    let roles = new Map();

    // Roles
    let role: Role;
    try {
        if (mode === "both" || mode === "roles") {
            await msg.member!.roles.add(
                await msg.guild.roles.create({
                    name: "Server Owner",
                    permissions: "Administrator"
                })
            );

            for (role of [...guild.roles.cache.values()].filter(x => !x.managed).sort((x, y) => y.position - x.position)) {
                if (role.id === guild.roles.everyone.id) continue;

                roles.set(role, await msg.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    mentionable: role.mentionable
                }));
            }

            roles.set(guild.roles.everyone, msg.guild.roles.everyone);
        }
    }
    catch (e) {
        e.message += `\nRole: ${role!?.id}`;
        throw e;
    }

    let channel: GuildChannel;
    let didSkipChannels = false;
    try {
        if (mode === "both" || mode === "channels") {
            // Categories
            for (let channel of ([...guild.channels.cache.values()]
                .filter(x => x instanceof CategoryChannel) as CategoryChannel[])
                .sort((x, y) => x.position - y.position)) {
                channels.set(channel, await msg.guild.channels.create({
                    name: channel.name,
                    type: channel.type,
                    permissionOverwrites: roles.size === 0
                        ? undefined
                        : [...channel.permissionOverwrites.cache.values()]
                            .filter(role => role.type === OverwriteType.Role && roles.has(guild.roles.resolve(role.id)))
                            .map(srcRole => ({
                                id: roles.get(guild.roles.resolve(srcRole.id)),
                                allow: srcRole.allow,
                                deny: srcRole.deny,
                                type: OverwriteType.Role
                            }))

                }));
            }

            // Normal channels
            for (let channel of ([...guild.channels.cache.values()]
                .filter(x => !(x instanceof CategoryChannel) && !(x instanceof ThreadChannel)) as Exclude<NonThreadGuildBasedChannel, CategoryChannel>[])
                .sort((x, y) => (x.position ?? 0) - (y.position ?? 0))) {
                const options = {
                    name: channel.name,
                    type: channel.type,
                    topic: (<TextChannel>channel).topic ?? undefined,
                    nsfw: (<TextChannel>channel).nsfw,
                    bitrate: (<VoiceBasedChannel>channel).bitrate,
                    userLimit: (<VoiceBasedChannel>channel).userLimit,
                    rateLimitPerUser: (<TextChannel>channel).rateLimitPerUser,
                    parent: channels.get(channel.parent),
                    permissionOverwrites: roles.size === 0
                        ? undefined
                        : [...channel.permissionOverwrites.cache.values()]
                            .filter(role => role.type === OverwriteType.Role && roles.has(guild.roles.resolve(role.id)))
                            .map(srcChannel => ({
                                id: roles.get(guild.roles.resolve(srcChannel.id)),
                                allow: srcChannel.allow,
                                deny: srcChannel.deny,
                                type: OverwriteType.Role
                            }))
                };
                
                try {
                    await msg.guild.channels.create(options);
                }
                catch (e) {
                    if (e.message === "Cannot execute action on this channel type" ||
                        e.message.includes("Value must be one of")) {
                        didSkipChannels = true;
                        continue;
                    }
                    if (e.rawError.errors.bitrate) {
                        options.bitrate = parseInt(e.message.match(/\d+/)[0]);
                        try {
                            await msg.guild.channels.create(options);
                            continue;
                        } catch (e2) {
                            e = e2;
                        }
                    }
                    throw e;
                }
            }
        }
    }
    catch (e) {
        e.message += `\nChannel: ${channel!?.id}`;
        throw e;
    }

    if (didSkipChannels) {
        const newTextChannel = msg.guild.channels.cache.find(x => x.isTextBased()) as GuildTextBasedChannel;

        await (cleanBeforeStarting
            ? newTextChannel?.send.bind(newTextChannel)
            : msg.channel.send.bind(msg.channel)
        )?.("Some channels were skipped as this server is not community-enabled.");
    }
}

export default defineCommand({
    key: "clone",
    args: [{
        key: "id",
        type: ApplicationCommandOptionType.String,
    }, {
        key: "mode",
        type: ApplicationCommandOptionType.String,
        choices: [{
            key: "channels",
            value: "channels"
        }, {
            key: "roles",
            value: "roles"
        }, {
            key: "both",
            value: "both"
        }]
    }, {
        key: "cleanBeforeStarting",
        type: ApplicationCommandOptionType.Boolean
    }],
    handler: cloneServer
});
