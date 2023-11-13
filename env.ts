/**
 * @file Keeps global bot state.
 */

import { Command, CommandFramework, ContextMenuCommand, EventHandlerOptions, InteractionCommandRequest } from "@s809/noisecord";
import { Client, GatewayIntentBits, GuildTextBasedChannel, IntentsBitField, LocaleString, Message, MessageContextMenuCommandInteraction, Partials, Snowflake, Team, User } from "discord.js";
import PLazy from "p-lazy";
import { debug, defaults, version } from "./constants";
import { CommandLogEntry, Guild as DbGuild, User as DbUser } from "./database/models";
import { getPrefix } from "./modules/data/getPrefix";
import { MapWithDefault } from "./modules/misc/MapWithDefault";
import { MusicPlayer } from "./modules/music/MusicPlayer";

export const client = new Client({
    intents: Object.values(IntentsBitField.Flags) as GatewayIntentBits[],
    partials: [Partials.Channel],
    presence: {
        activities: [{
            name: debug
                ? `v${version.split("-")[0]}-dev`
                : `v${version}`,
        }]
    }
});

const commonHandlerOptions = {
    onSlowCommand(req) {
        CommandLogEntry.setEntry(req);
        return this.defaultStatusHandlers.onSlowCommand.call(this, req);
    },
    onSuccess(req) {
        CommandLogEntry.setEntry(req, true);
        return this.defaultStatusHandlers.onSuccess.call(this, req);
    },
    onFailure(req, error) {
        CommandLogEntry.setEntry(req, false);
        return this.defaultStatusHandlers.onFailure.call(this, req, error);
    },
} satisfies Partial<EventHandlerOptions>;

export const commandFramework: CommandFramework = new CommandFramework(client, {
    commandRegistryOptions: {
        commandModuleDirectory: "./build/commands",
        contextMenuModuleDirectory: "./build/contextMenuCommands",
        requireCommandTranslations: true
    },
    translationOptions: {
        translationFileDirectory: "./translations",
        defaultLocale: defaults.locale,
        getUserLocale: async user => (await DbUser.findByIdOrDefault(user.id, { language: 1 })).language as LocaleString ?? null,
        getGuildLocale: async guild => (await DbGuild.findByIdOrDefault(guild.id, { language: 1 })).language as LocaleString ?? null
    },
    interactionCommands: {
        registerApplicationCommands: true,
        ...commonHandlerOptions
    },
    messageCommands: {
        prefix: msg => getPrefix(msg.guildId),
        ignoreAllPermissionsFor: msg => isBotOwner(msg.author),
        ignoreOwnerOnlyFor: async (msg, command) => {
            const dbUser = PLazy.from(() => DbUser.findByIdOrDefault(msg.author.id, { flags: 1 }));
            const dbGuild = PLazy.from(() => DbGuild.findByIdOrDefault(msg.guildId, { flags: 1 }));

            for (const splitPath = command.path.split("/"); splitPath.length; splitPath.pop()) {
                if ((await dbUser).flags.includes(`allow_${commandFramework.commandRegistry.getCommandTranslationPath(splitPath.join("/"))}`))
                    return true;
            }
            for (const splitPath = command.path.split("/"); splitPath.length; splitPath.pop()) {
                if ((await dbGuild).flags.includes(`allow_${commandFramework.commandRegistry.getCommandTranslationPath(splitPath.join("/"))}`))
                    return true;
            }

            return false;
        },
        ...commonHandlerOptions
    }
});

export async function isBotOwner(user: User) {
    if (!client.application?.owner) return false;

    return client.application.owner.id === user.id
        || (client.application.owner as Team).members?.map(x => x.user).includes(user)
        || (await DbUser.findByIdOrDefault(user.id, { flags: 1 }))!.flags.includes("owner");
}

export const runtimeGuildData = new MapWithDefault<Snowflake, {
    musicPlayer?: MusicPlayer,
    inviteTracker?: {
        logChannel: GuildTextBasedChannel,
        counts: Map<string, number>,
    },

    channels: MapWithDefault<Snowflake, {
        textGenEnabled?: boolean,
        pinnedMessageUpdater?: (msg: Message) => void,

        members: MapWithDefault<Snowflake, {
            lastCommand?: {
                command: Command,
                args: object
            },
            messageSelectionRange?: {
                begin: Snowflake,
                end: Snowflake,
                lastRequest?: InteractionCommandRequest<ContextMenuCommand, MessageContextMenuCommandInteraction>
            }
        }>
    }>
}>(() => ({
    channels: new MapWithDefault(() => ({
        members: new MapWithDefault(() => ({}))
    }))
}));
