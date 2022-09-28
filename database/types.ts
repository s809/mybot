import { HydratedDocument, Model } from 'mongoose';

export type Contents<T> = T extends Model<infer U> ? U : never;
export type DocumentOf<T> = HydratedDocument<Contents<T>>;
