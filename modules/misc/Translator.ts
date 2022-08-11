import { Guild, GuildResolvable, Message, Snowflake } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { get } from "lodash-es";
import { client, data } from "../../env";
import { formatString } from "../../util";

export class Translator {
    private static translators: Map<string, Translator> = new Map();
    private data: object;

    static {
        const translationDir = "./translations/";

        for (let file of readdirSync(translationDir))
            Translator.translators.set(file.split(".")[0], new Translator(translationDir + file));
    }
    
    constructor(path: string) {
        this.data = JSON.parse(readFileSync(path, "utf8"));
    }

    /**
     * @see Translator.getOrDefault
     */
    static get(nameOrContext: string | Message | GuildResolvable): Translator | null {
        let language: string;

        if (typeof nameOrContext === "string") {
            language = nameOrContext;
        } else if (nameOrContext instanceof Guild) {
            language = data.guilds[nameOrContext.id].language
        } else if (nameOrContext.guild) {
            language = data.guilds[nameOrContext.guild.id].language;
        } else if (nameOrContext instanceof Message) {
            language = data.users[nameOrContext.author.id].language;
        } else {
            throw new Error("Invalid context type.");
        }

        return Translator.translators.get(language) ?? null;
    }

    /**
     * Returns a translator by language name or given context.
     * 
     * @param nameOrContext Message or name to use.
     * @returns
     */
    static getOrDefault(nameOrContext: string | Message | GuildResolvable): Translator {
        return Translator.get(nameOrContext) ?? Translator.translators.get("en")!;
    }

    /**
     * Get a translation string.
     * 
     * @param path Path of translation entry.
     * @param args Arguments for string interpolation.
     * @returns String with translation or passed path, if it was not found.
     */
    translate(path: string, ...args: string[]): string {
        return this.tryTranslate(path, ...args) ?? path;
    }

    /**
     * Get a translation string.
     * 
     * @param path Path of translation entry.
     * @param args Arguments for string interpolation.
     * @returns String with translation or null, if it was not found.
     */
    tryTranslate(path: string, ...args: string[]): string | null {
        var source = get(this.data, path);
        return source ? formatString(source, ...args) : null;
    }
}
