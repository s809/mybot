import { defaults } from "../constants";

export function mapOf<T>(of: T) {
    return {
        type: Map,
        of
    };
}

function modifyType<T, U>(type: T, join: U): (T extends object
    ? T extends any[] | Function
        ? { type: T }
        : T
    : { type: T })
    & U {
    const result = typeof type === "object" && !Array.isArray(type)
        ? { ...type }
        : { type };
    return {
        ...result,
        ...join
    } as any;
}

export function required<T>(type: T): ReturnType<typeof modifyType<T, { required: true }>> {
    return modifyType(type, { required: true });
}

export function requiredAll<T extends object>(type: T): {
    [K in keyof T]: ReturnType<typeof required<T[K]>>
} {
    return Object.fromEntries(Object.entries(type).map(([k, v]) => [k, required(v)])) as any;
}

export function requiredAllExceptParent<T extends object>(type: T) {
    return {
        type: requiredAll(type),
        required: false
    };
}

export function requiredMapOf<T>(of: T) {
    return required(mapOf(of));
}

type PossiblyBoxed<T> = T extends string
    ? String
    : T extends number
    ? Number
    : T extends boolean
    ? Boolean
    : T;

// function/constructor
export function defaultValue<T extends ((...args: any) => PossiblyBoxed<U>), U>(type: T, defaultValue: U): { type: T, default: U };
export function defaultValue<T extends (new (...args: any) => PossiblyBoxed<U>), U>(type: T, defaultValue: U): { type: T, default: U };
// [function/constructor]
export function defaultValue<T extends ((...args: any[]) => PossiblyBoxed<U>)[], U>(type: T, defaultValue: U[]): { type: T, default: U[] };
export function defaultValue<T extends (new (...args: any[]) => PossiblyBoxed<U>)[], U>(type: T, defaultValue: U[]): { type: T, default: U[] };
// { type: function/constructor }
export function defaultValue<T extends { type: (...args: any[]) => PossiblyBoxed<U> }, U>(type: T, defaultValue: U): T & { default: U };
export function defaultValue<T extends { type: new (...args: any[]) => PossiblyBoxed<U> }, U>(type: T, defaultValue: U): T & { default: U };
// { type: [function/constructor] }
export function defaultValue<T extends { type: ((value?: any) => PossiblyBoxed<U>)[] }, U>(type: T, defaultValue: U[]): T & { default: U[] };
export function defaultValue<T extends { type: (new (...args: any[]) => PossiblyBoxed<U>)[] }, U>(type: T, defaultValue: U[]): T & { default: U[] };
// impl
export function defaultValue(type: any, defaultValue: any) {
    return modifyType(type, { default: defaultValue });
}

export const languageData = {
    language: defaultValue(required(String), defaults.locale)
}

export const flagData = {
    flags: defaultValue(required([String]), <string[]>[])
}

export const stringId = {
    _id: String
}
