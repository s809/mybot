import { FlattenMaps, HydratedDocument, Model, Require_id } from 'mongoose';

export type Contents<T> = T extends Model<infer U> ? U : never;
export type DocumentOf<T> = HydratedDocument<Contents<T>>;
export type RawContents<T> = Require_id<FlattenMaps<FlattenMaps<Contents<T>>>>;
