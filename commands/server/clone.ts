import { CommandRequest, defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType, CategoryChannel, GuildChannel, GuildTextBasedChannel, NonThreadGuildBasedChannel, OverwriteType, PermissionFlagsBits, Role, Snowflake, TextChannel, ThreadChannel, VoiceBasedChannel } from "discord.js";
import { client } from "../../env";

async function cloneServer(req: CommandRequest<true>, {
    id: guildId,
    mode,
    clean
}: {
    id: Snowflake;
    mode: string;
    clean: boolean;
}) {
    if ((mode === "both" || mode === "roles")
        && !req.guild.members.me?.roles.cache.some(role => role.id != req.guild.roles.everyone.id && role.permissions.has(PermissionFlagsBits.Administrator))) {
        return "Bot must have an administrator role above **@**everyone before proceeding.";
    } else if (!req.guild.members.me?.permissions.has(PermissionFlagsBits.Administrator)) {
        // Channels only
        return "Bot must be administrator before proceeding.";
    }

    let guild = await client.guilds.fetch(guildId);

    if (clean) {
        if (mode === "both" || mode === "channels") {
            for (const channel of req.guild.channels.cache.values())
                await channel.delete().catch(() => { });
        }

        if (mode === "both" || mode === "roles") {
            for (const role of req.guild.roles.cache.values())
                await role.delete().catch(() => { });
        }
    }

    // Mapping: Source -> Target
    let channels = new Map();
    let roles = new Map();

    // Roles
    let role: Role;
    try {
        if (mode === "both" || mode === "roles") {
            for (role of [...guild.roles.cache.values()].filter(x => !x.managed).sort((x, y) => y.position - x.position)) {
                if (role.id === guild.roles.everyone.id) continue;

                roles.set(role, await req.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    mentionable: role.mentionable
                }));
            }

            await req.guild.roles.everyone.setPermissions(guild.roles.everyone.permissions);
            roles.set(guild.roles.everyone, req.guild.roles.everyone);
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
                channels.set(channel, await req.guild.channels.create({
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
                    userLimit: Math.min((<VoiceBasedChannel>channel).userLimit, 99),
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
                    channels.set(channel, await req.guild.channels.create(options));
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
                            channels.set(channel, await req.guild.channels.create(options));
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
        const newTextChannel = req.guild.channels.cache.find(x => x.isTextBased()) as GuildTextBasedChannel;

        await (clean
            ? newTextChannel?.send.bind(newTextChannel)
            : req.channel.send.bind(req.channel)
        )?.("Some channels were skipped as this server is not community-enabled.");
    }

    if (guild.systemChannelId)
        await req.guild.setSystemChannel(channels.get(guild.systemChannel));

    if (guild.safetyAlertsChannelId)
        await req.guild.setSafetyAlertsChannel(channels.get(guild.safetyAlertsChannel));

    if (guild.features.includes("COMMUNITY") && req.guild.features.includes("COMMUNITY")) {
        const prevRulesChannel = req.guild.rulesChannel;
        const prevPublicUpdatesChannel = req.guild.publicUpdatesChannel;

        await req.guild.setRulesChannel(channels.get(guild.rulesChannel));
        await req.guild.setPublicUpdatesChannel(channels.get(guild.publicUpdatesChannel));

        if (clean) {
            await prevRulesChannel?.delete();
            if (prevPublicUpdatesChannel !== prevRulesChannel)
                await prevPublicUpdatesChannel?.delete();
        }
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
        key: "clean",
        type: ApplicationCommandOptionType.Boolean
    }],
    handler: cloneServer
});
