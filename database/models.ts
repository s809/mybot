import { model, Schema } from 'mongoose';
import { defaults } from "../constants";
import { MapValue } from '../util';
import { findByIdOrDefault, guildDefaults, userDefaults } from './defaults';
import { defaultValue, flagData, languageData, mapOf, required, requiredAll, requiredAllExceptParent, requiredMapOf, stringId } from './parts';
import { DocumentOf } from './types';

export const Guild = model("guilds", new Schema({
    ...stringId,

    ...languageData,
    ...flagData,
    prefix: defaultValue(required(String), defaults.prefix),

    inviteTracker: requiredAllExceptParent({
        logChannelId: String
    }),

    roles: defaultValue(requiredMapOf({}), new Map()),
    members: defaultValue(requiredMapOf({}), new Map()),
    channels: defaultValue(requiredMapOf({
        ...flagData,

        pinnedMessage: requiredAllExceptParent({
            content: String,
            interval: Number,
            lastMessage: String
        })
    }), new Map())
}, {
    strict: false,
    statics: {
        findByIdOrDefault(id, projection?) {
            return findByIdOrDefault(this, guildDefaults, id, projection);
        },
        updateByIdWithUpsert(id, update) {
            return this.updateOne({ _id: id }, update, { upsert: true });
        }
    }
}));
export type RoleData = MapValue<DocumentOf<typeof Guild>["roles"]>;
export type MemberData = MapValue<DocumentOf<typeof Guild>["members"]>;
export type ChannelData = MapValue<DocumentOf<typeof Guild>["channels"]>;
export type InviteTrackerData = NonNullable<DocumentOf<typeof Guild>["inviteTracker"]>;

export const User = model("users", new Schema({
    ...stringId,
    ...languageData,
    ...flagData,

    oauth2: requiredAllExceptParent({
        accessToken: String,
        refreshToken: String,
        expiresAt: Number
    })
}, {
    strict: false,
    statics: {
        findByIdOrDefault(id, projection?) {
            return findByIdOrDefault(this, userDefaults, id, projection);
        },
        updateByIdWithUpsert(id, update) {
            return this.updateOne({ _id: id }, update, { upsert: true });
        }
    }
}));

export const ScriptList = model("scripts", new Schema({
    ...stringId,
    items: requiredMapOf(String)
}));

export const TextGenData = model("textGenData", new Schema({
    ...stringId,
    entrypoints: defaultValue(requiredMapOf([String]), new Map()),
    words: defaultValue(mapOf(requiredAll({
        encounterCount: Number,
        nextWords: mapOf(Number),
        wasLast: Boolean
    })), new Map())
}));

export const CommandLogEntry = model("commandLog", new Schema({
    ...stringId,

    type: required(String),
    request: required(String),
    success: Boolean,

    user: required(String),
    guild: String
}, {
    statics: {
        setEntry(req, success: boolean | undefined = undefined) {
            const _id = req.interaction?.id ?? req.message.id;

            this.replaceOne({ _id }, {
                ...req.interaction
                    ? {
                        type: "interaction",
                        request: req.interaction.toString(),
                    }
                    : {
                        type: "message",
                        request: req.message.toString(),
                    },
                success,

                user: req.author.id,
                guild: req.guildId
            }, {
                upsert: true
            }).finally(() => { });
        }
    }
}));
