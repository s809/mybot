import { model, Schema } from 'mongoose';
import { MapValue } from '../util';
import { guildDefaults, userDefaults, findByIdOrDefault, findByIdOrDefaultAndUpdate } from './defaults';
import { DocumentOf } from './types';
import { stringId, languageData, flagData, mapOf, requiredAll, requiredMapOf, required, requiredAllExceptParent } from './parts';

export const Guild = model("guilds", new Schema({
    ...stringId,

    ...languageData,
    ...flagData,
    prefix: required(String),

    inviteTracker: requiredAllExceptParent({
        logChannelId: String
    }),

    roles: requiredMapOf({}),
    members: requiredMapOf({}),
    channels: requiredMapOf({
        ...flagData,
        textGenData: requiredAllExceptParent({
            entrypoints: mapOf([String]),
            words: mapOf(requiredAll({
                encounterCount: Number,
                nextWords: mapOf(Number),
                wasLast: Boolean
            })),
        })
    })
}, {
    strict: false,
    statics: {
        findByIdOrDefault(id) {
            return findByIdOrDefault(this, id, guildDefaults);
        },
        findByIdOrDefaultAndUpdate(id, doc) {
            return findByIdOrDefaultAndUpdate(this, id, doc, guildDefaults);
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
        findByIdOrDefault(id) {
            return findByIdOrDefault(this, id, userDefaults);
        },
        findByIdOrDefaultAndUpdate(id, doc) {
            return findByIdOrDefaultAndUpdate(this, id, doc, userDefaults);
        }
    }
}));

export const ScriptList = model("scripts", new Schema({
    ...stringId,
    items: requiredMapOf(String)
}));
