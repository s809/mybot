import { CommandInteraction, Guild, GuildResolvable, LocaleString, Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { get } from "lodash-es";
import { data } from "../../env";
import { formatString } from "../../util";
import { CommandMessage } from "../commands/appCommands";

export class Translator {
    private static _translators: Map<string, Translator> = new Map();
    private data: object;

    static readonly fallbackLocale: LocaleString = "en-US";

    static get translators(): ReadonlyMap<string, Translator> {
        return Translator._translators;
    }

    static {
        const translationDir = "./translations/";

        for (let file of readdirSync(translationDir))
            new Translator(translationDir + file);
    }
    
    constructor(path: string) {
        this.data = JSON.parse(readFileSync(path, "utf8"));
        for (let localeString of this.localeStrings)
            Translator._translators.set(localeString, this);
    }

    get localeStrings(): LocaleString[] {
        return get(this.data, "locale_strings");
    }

    /**
     * @see Translator.getOrDefault
     */
    static get(nameOrContext: string | Message | CommandInteraction | GuildResolvable | CommandMessage): Translator | null {
        let language: string;

        if (typeof nameOrContext === "string") {
            language = nameOrContext;
        } else if (nameOrContext instanceof Guild) {
            language = data.guilds[nameOrContext.id].language
        } else if (nameOrContext.guild) {
            language = data.guilds[nameOrContext.guild.id].language;
        } else if (nameOrContext instanceof Message || nameOrContext instanceof CommandMessage) {
            language = data.users[nameOrContext.author.id].language;
        } else if (nameOrContext instanceof CommandInteraction) {
            language = data.users[nameOrContext.user.id].language;
        } else {
            throw new Error("Invalid context type.");
        }

        return Translator._translators.get(language) ?? null;
    }

    /**
     * Returns a translator by language name or given context.
     * 
     * @param nameOrContext Message or name to use.
     * @returns
     */
    static getOrDefault(nameOrContext: string | Message | GuildResolvable | CommandMessage): Translator {
        return Translator.get(nameOrContext) ?? Translator._translators.get(Translator.fallbackLocale)!;
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
