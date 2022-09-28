import { Model, UpdateQuery } from 'mongoose';
import { defaultPrefix } from '../env';
import { Contents, DocumentOf } from './types';

export const guildDefaults = (_id: string) => ({
    _id,
    language: "en-US",
    flags: [],
    prefix: defaultPrefix,

    roles: new Map(),
    members: new Map(),
    channels: new Map()
});

export const userDefaults = (_id: string) => ({
    _id,
    language: "en-US",
    flags: []
});

export const scriptListDefaults = (_id: string) => ({
    _id,
    items: new Map()
});

export const guildRoleDefaults = () => ({});
export const guildMemberDefaults = () => ({});
export const guildChannelDefaults = () => ({
    flags: []
});

export async function findByIdOrDefault<T extends Model<Contents<T>>>(model: T, id: string, getDefaults: (_id: string) => Contents<T>): Promise<DocumentOf<T>> {
    return await model.findById(id) ?? new model(getDefaults(id)) as any;
}

export async function findByIdOrDefaultAndUpdate<T extends Model<Contents<T>>>(model: T, id: string, doc: UpdateQuery<Contents<T>>, getDefaults: (_id: string) => Contents<T>): Promise<DocumentOf<T>> {
    return await model.findByIdAndUpdate(id, doc) ?? model.create({ ...getDefaults(id), ...doc });
}
