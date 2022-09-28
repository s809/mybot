export function mapOf<T>(of: T) {
    return {
        type: Map,
        of
    };
}

export function required<T>(type: T): (T extends object
    ? T extends any[]
        ? { type: T }
        : T extends Function
            ? { type: T }
            : T
    : { type: T })
    & { required: true } {
    const result = typeof type === "object" && !Array.isArray(type)
        ? { ...type }
        : { type };
    return {
        ...result,
        required: true
    } as any;
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

export const languageData = {
    language: required(String)
}

export const flagData = {
    flags: required([String])
}

export const stringId = {
    _id: String
}
