import { Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { get } from "lodash-es";
import { data } from "../../env.js";
import { formatString } from "../../util.js";

export class Translator {
    /** @type {Map<string, Translator>} */
    static #translators = new Map();

    /** @type {object} */
    #data;

    static {
        const translationDir = "./translations/";

        for (let file of readdirSync(translationDir))
            Translator.#translators.set(file.split(".")[0], new Translator(translationDir + file));
    }

    /**
     * @param {string} path 
     */
    constructor(path) {
        this.#data = JSON.parse(readFileSync(path));
    }

    /**
     * Returns a translator by name or context of message.
     * 
     * @param {string | Message} msgOrName Message or name to use.
     * @returns {Translator?}
     */
    static get(msgOrName) {
        /** @type {string | Message} */
        let language;

        if (typeof msgOrName === "string")
            language = msgOrName;

        language ??= msgOrName.guild
            ? data.guilds[msgOrName.guildId].language
            : data.users[msgOrName.author.id].language;

        return Translator.#translators.get(language) ?? null;
    }

    /**
     * Get a translation string.
     * 
     * @param {string} path Path of translation entry.
     * @param {string[]} args Arguments for string interpolation.
     * @returns {string?} String with translation.
     */
    translate(path, ...args) {
        var source = get(this.#data, path);
        return source ? formatString(source, ...args) : null;
    }
}
