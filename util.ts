/**
 * @file Some useful functions.
 */
import { botDirectory } from "./constants";

/**
 * Extracts ID from mention.
 * 
 * @param text Text containing mention.
 * @returns Extracted ID.
 */
export function parseMention(text: string, prefix: string): string | null {
    if (/^\d{17,19}$/.test(text))
        return text;

    let regex = new RegExp(`^<${prefix}(\\d{17,19})>$`)
    return text.match(regex)?.[1] ?? null;
}

/**
 * Extracts channel ID from mention.
 * 
 * @param text Text containing mention.
 * @returns Extracted ID.
 */
export function parseChannelMention(text: string) {
    return parseMention(text, "#");
}

/**
 * Extracts user ID from mention.
 * 
 * @param text Text containing mention.
 * @returns Extracted ID.
 */
export function parseUserMention(text: string) {
    return parseMention(text, "@") ?? parseMention(text, "@!");
}

/**
 * Extracts role ID from mention.
 * 
 * @param text Text containing mention.
 * @returns Extracted ID.
 */
export function parseRoleMention(text: string) {
    return parseMention(text, "@&");
}


/**
 * Wraps text in titled borders.
 * 
 * @param title Title for wrapping.
 * @param text Text to wrap.
 * @returns Wrapped text.
 */
export function wrapText(title: string, text: string): string {
    title = title.toUpperCase();

    return `----- ${title} -----\n` +
        text +
        `\n----- END ${title} -----`;
}

/**
 * Removes paths to bot in string.
 * 
 * @param text Text with paths to be sanitized.
 * @returns Sanitized text.
 */
export function sanitizePaths(text: string): string {
    return text.replaceAll(botDirectory, ".").replaceAll("file://", "");
}

/**
 * Formats duration, stripping hour part if not in use.
 * 
 * @param duration Duration in seconds.
 * @returns Formatted duration.
 */
export function formatDuration(duration: any): string {
    var hours: number | string = Math.floor(duration / 3600);
    var minutes: number | string = Math.floor((duration - (hours * 3600)) / 60);
    var seconds: number | string = Math.floor(duration - (hours * 3600) - (minutes * 60));

    if (hours !== 0 && hours < 10)
        hours = "0" + hours + ":";
    if (minutes < 10)
        minutes = "0" + minutes;
    if (seconds < 10)
        seconds = "0" + seconds;

    return (hours ? hours as string : "") + minutes + ":" + seconds;
}

/**
 * Skips string past specified parts and removes leading whitespace.
 * 
 * @param text String to skip in.
 * @param parts Parts to skip.
 * @returns String with skipped parts.
 */
export function skipStringAfter(text: string, ...parts: string[]) {
    for (let part of parts)
        text = text.slice(text.indexOf(part) + part.length).trimStart();

    return text;
}

/**
 * Formats string. \
 * Tokens used for formatting are **$1**, **$2** and so on.
 * 
 * @param text Text to format.
 * @param args Arguments for embedding into string.
 * @returns Formatted string.
 */
export function formatString(text: string, ...args: string[]) {
    return text.replaceAll(/\\?\$(\d+)/g, (match, value) => {
        if (match[0] === "\\")
            return match.slice(1);

        let replacedValue = args[parseInt(value) - 1];
        if (replacedValue === undefined)
            throw new Error(`Value for $${value} is missing`);
        return replacedValue;
    });
}

/**
 * Capitalizes words in a given string.
 * 
 * @param text String with words to capitalize.
 * @returns String with capitalized words.
 */
export function capitalizeWords(text: string) {
    return text.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}

/**
 * Transforms a given string using a transformation map.
 * 
 * @param text String to transform.
 * @param map Map to use for transforming.
 * @returns Transformed string.
 */
export function transformString(text: string, map: [string, string][]) {
    for (const [from, to] of map)
        text = text.replaceAll(from, to);
    return text;
}

export function getOrSet<K, V>(map: Map<K, V>, key: K, defaultValue: NonNullable<V>, slow = false) {
    return map.get(key) ?? (map.set(key, defaultValue), slow ? map.get(key)! : defaultValue);
}

export type Overwrite<T, U> = Omit<T, keyof U> & U;

export type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type DistributiveOmit<T, K extends keyof any> = T extends any
    ? Omit<T, K>
    : never;

export type MapValue<T> = T extends Map<any, infer I> ? I : never;
