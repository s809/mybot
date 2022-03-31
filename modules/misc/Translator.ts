import { Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { get } from "lodash-es";
import { data } from "../../env";
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
     * Returns a translator by name or context of message.
     * 
     * @param msgOrName Message or name to use.
     * @returns
     */
    static get(msgOrName: string | Message): Translator | null {
        let language: string;

        if (typeof msgOrName === "string") {
            language = msgOrName;
        } else {
            language ??= msgOrName.guild
                ? data.guilds[msgOrName.guildId].language
                : data.users[msgOrName.author.id].language;
        }

        return Translator.translators.get(language) ?? null;
    }

    /**
     * Get a translation string.
     * 
     * @param path Path of translation entry.
     * @param args Arguments for string interpolation.
     * @returns String with translation.
     */
    translate(path: string, ...args: string[]): string | null {
        var source = get(this.data, path);
        return source ? formatString(source, ...args) : null;
    }
}
