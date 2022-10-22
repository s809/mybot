import { model, Schema } from 'mongoose';
import { MapValue } from '../util';
import { guildDefaults, userDefaults, findByIdOrDefault } from './defaults';
import { DocumentOf } from './types';
import { defaultValue, stringId, languageData, flagData, mapOf, requiredAll, requiredMapOf, required, requiredAllExceptParent } from './parts';
import { defaults } from "../constants";

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
    ...flagData
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
}))
