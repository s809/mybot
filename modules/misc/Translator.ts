import { CommandInteraction, Guild, GuildResolvable, LocaleString, Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { get } from "lodash-es";
import { Guild as DbGuild, User as DbUser } from "../../database/models";
import { defaults } from "../../constants";
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

    get booleanValues() {
        return this.translator.booleanValues;
    }

    get getTranslationFromRecord() {
        return this.translator.getTranslationFromRecord;
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

    static get fallbackTranslator() {
        const translator = this._translators.get(defaults.locale);
        if (!translator)
            throw new Error("Default translator is not initialized.");
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

    static async getLanguage(nameOrContext: string | Message | CommandInteraction | GuildResolvable) {
        if (typeof nameOrContext === "string") {
            return nameOrContext;
        } else if (nameOrContext instanceof Guild) {
            return (await DbGuild.findByIdOrDefault(nameOrContext.id, { language: 1 })).language
        } else if (nameOrContext.guild) {
            return (await DbGuild.findByIdOrDefault(nameOrContext.guild.id, { language: 1 })).language;
        } else if (nameOrContext instanceof Message) {
            return (await DbGuild.findByIdOrDefault(nameOrContext.author.id, { language: 1 })).language;
        } else if (nameOrContext instanceof CommandInteraction) {
            return (await DbGuild.findByIdOrDefault(nameOrContext.user.id, { language: 1 })).language;
        } else {
            throw new Error("Invalid context.");
        }
    }

    /**
     * @see Translator.getOrDefault
     */
    static async get(nameOrContext: NameOrContext): Promise<Translator | null> {
        return Translator._translators.get(await this.getLanguage(nameOrContext)) ?? null;
    }

    /**
     * Returns a translator by language name or given context.
     * 
     * @param nameOrContext Message or name to use.
     */
    static async getOrDefault(nameOrContext: NameOrContext): Promise<Translator>;
    
    /**
     * Returns a translator by language name or given context.
     * 
     * @param nameOrContext Message or name to use.
     * @param prefix Prefix to use with returned instance.
     */
    static async getOrDefault(nameOrContext: NameOrContext, prefix: string): Promise<PrefixedTranslator>;

    static async getOrDefault(nameOrContext: NameOrContext, prefix?: string): Promise<PrefixedTranslator | Translator> {
        const translator = await Translator.get(nameOrContext) ?? Translator.fallbackTranslator;
        if (!prefix)
            return translator;
        
        const prefixedTranslator = PrefixedTranslator.translators.get(translator.localeString)?.get(prefix);
        if (!prefixedTranslator)
            return new PrefixedTranslator(translator, prefix);
        return prefixedTranslator;
    }

    static getLocalizations(translationPath: string) {
        return Object.fromEntries([...Translator.translators.values()]
            .map(t => [t.localeString, t.tryTranslate(translationPath)] as [LocaleString, string | null])
            .filter(([, translation]) => translation !== null)) as Record<LocaleString, string>;
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

    /**
     * Gets a translation value from object using this translator's locale string as a key.
     * Tries to get result by a default locale key if this translator's key was not found.
     * 
     * @param obj Object to get value from.
     * @returns Value from object or undefined.
     */
    getTranslationFromRecord(obj: Partial<Record<LocaleString, any>>) {
        return obj[this.localeString] ?? obj[defaults.locale];
    }
}
