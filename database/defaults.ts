import { Model, ProjectionType } from 'mongoose';
import { defaults } from "../constants";
import { Contents, DocumentOf } from './types';

export const guildDefaults = (_id: string) => ({
    _id,
    language: undefined,
    flags: [],
    prefix: defaults.prefix,

    roles: new Map(),
    members: new Map(),
    channels: new Map()
});

export const userDefaults = (_id: string) => ({
    _id,
    language: undefined,
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

export async function findByIdOrDefault<T extends Model<Contents<T>>>(model: T, getDefaults: (_id: string) => Contents<T>, id: string, projection?: ProjectionType<T> | null): Promise<DocumentOf<T>> {
    return await model.findById(id, projection) ?? new model(getDefaults(id)) as any;
}
