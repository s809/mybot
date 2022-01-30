import { Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { data } from "../../env.js";
import { formatString } from "../../util.js";

const translationsDir = "./translations/";
/**
 * @type {Map<string, {
 *  [categories: string]: {
 *   [strings: string]: string
 *  }
 * }>}
 */
const translations = new Map();

/**
 * Get a translation string.
 * 
 * @param {string} lang Language of translation.
 * @param {string} category Category of translation.
 * @param {string} name Name of translation entry.
 * @param {string[]} args Arguments for string interpolation.
 * @returns {string} String with translation.
 */
export function getTranslation(lang, category, name, ...args) {
    var source = translations.get(lang)[category][name];
    return source ? formatString(source, ...args) : null;
}

/**
 * Checks whether a given translation exists.
 * 
 * @param {string} lang Language of translation.
 * @param {string} category Category of translation.
 * @param {string} name Name of translation entry.
 * @returns {boolean}
 */
export function translationExists(lang, category, name) {
    return translations.get(lang)[category][name] !== undefined;
}

/**
 * Checks whether a given language exists.
 * 
 * @param {string} lang Language of translation.
 * @returns {boolean}
 */
export function languageExists(lang) {
    return translations.has(lang);
}

/**
 * Returns language by context of message.
 * 
 * @param {Message} msg Message to use.
 * @returns {string}
 */
export function getLanguageByMessage(msg) {
    return msg.guild
        ? data.guilds[msg.guildId].language
        : data.users[msg.author.id].language;
}

function loadTranslations() {
    for (let file of readdirSync(translationsDir))
        translations.set(file.split(".")[0], JSON.parse(readFileSync(translationsDir + file)));
}

loadTranslations();
