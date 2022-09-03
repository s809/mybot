import { CommandInteraction, Guild, GuildResolvable, LocaleString, Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { get } from "lodash-es";
import { data } from "../../env";
import { formatString } from "../../util";

export class PrefixedTranslator {
    readonly translator: Translator;
    private prefix: string;

    static get translators(): ReadonlyMap<LocaleString, ReadonlyMap<string, PrefixedTranslator>> {
        return this._translators;
    }
    private static _translators = new Map<LocaleString, Map<string, PrefixedTranslator>>();

    constructor(translator: Translator, prefix: string) {
        this.translator = translator;
        this.prefix = prefix;

        let byLocale = PrefixedTranslator._translators.get(translator.localeString);
        if (!byLocale) {
            byLocale = new Map();
            PrefixedTranslator._translators.set(translator.localeString, byLocale);
        }
        byLocale.set(prefix, this);
    }

    get localeString() {
        return this.translator.localeString;
    }

    translate(path: string, ...args: string[]) {
        return this.translator.tryTranslate(`${this.prefix}.${path}`, ...args)
            ?? Translator.fallbackTranslator.tryTranslate(`${this.prefix}.${path}`, ...args)
            ?? this.translator.translate(path, ...args);
    };
}

type NameOrContext = Parameters<typeof Translator.getLanguage>[0];
export class Translator {
    readonly localeString: LocaleString;
    readonly setLanguageRegex: RegExp;
    readonly booleanValues: [string[], string[]];

    private data: object;

    static readonly fallbackLocale: LocaleString = "en-US";
    static get fallbackTranslator() {
        const translator = this._translators.get(this.fallbackLocale);
        if (!translator)
            throw new Error("Fallback translator not initialized.");
        return translator;
    }

    static get translators(): ReadonlyMap<string, Translator> {
        return Translator._translators;
    }
    private static _translators: Map<string, Translator> = new Map();

    static {
        const translationDir = "./translations/";

        for (let file of readdirSync(translationDir))
            new Translator(translationDir + file);
    }
    
    constructor(path: string) {
        this.data = JSON.parse(readFileSync(path, "utf8"));

        this.localeString = get(this.data, "locale_string");
        this.setLanguageRegex = new RegExp(`^${get(this.data, "set_language_regex")}$`, "iu");
        this.booleanValues = get(this.data, "boolean_values");

        Translator._translators.set(this.localeString, this);
    }

    static getLanguage(nameOrContext: string | Message | CommandInteraction | GuildResolvable) {
        if (typeof nameOrContext === "string") {
            return nameOrContext;
        } else if (nameOrContext instanceof Guild) {
            return data.guilds[nameOrContext.id].language
        } else if (nameOrContext.guild) {
            return data.guilds[nameOrContext.guild.id].language;
        } else if (nameOrContext instanceof Message) {
            return data.users[nameOrContext.author.id].language;
        } else if (nameOrContext instanceof CommandInteraction) {
            return data.users[nameOrContext.user.id].language;
        } else {
            throw new Error("Invalid context type.");
        }
    }

    /**
     * @see Translator.getOrDefault
     */
    static get(nameOrContext: NameOrContext): Translator | null {
        return Translator._translators.get(this.getLanguage(nameOrContext)) ?? null;
    }

    /**
     * Returns a translator by language name or given context.
     * 
     * @param nameOrContext Message or name to use.
     */
    static getOrDefault(nameOrContext: NameOrContext): Translator;
    
    /**
     * Returns a translator by language name or given context.
     * 
     * @param nameOrContext Message or name to use.
     * @param prefix Prefix to use with returned instance.
     */
    static getOrDefault(nameOrContext: NameOrContext, prefix: string): PrefixedTranslator;

    static getOrDefault(nameOrContext: NameOrContext, prefix?: string): Translator | PrefixedTranslator {
        const translator = Translator.get(nameOrContext) ?? Translator.fallbackTranslator;
        if (!prefix)
            return translator;
        
        const prefixedTranslator = PrefixedTranslator.translators.get(translator.localeString)?.get(prefix);
        if (!prefixedTranslator)
            return new PrefixedTranslator(translator, prefix);
        return prefixedTranslator;
    }

    /**
     * Get a translation string.
     * 
     * @param path Path of translation entry.
     * @param args Arguments for string interpolation.
     * @returns String with translation or passed path, if it was not found.
     */
    translate(path: string, ...args: string[]): string {
        return this.tryTranslate(path, ...args)
            ?? Translator.fallbackTranslator.tryTranslate(path, ...args)
            ?? path;
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
