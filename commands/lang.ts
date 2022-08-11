import { Message } from "discord.js";
import { data } from "../env";
import { Command } from "../modules/commands/definitions";
import { Translator } from "../modules/misc/Translator";

function lang(msg: Message, newLang: string) {
    let translator = Translator.getOrDefault(msg);

    if (msg.member && !msg.member.permissions.has("ManageGuild"))
        return translator.translate("errors.cannot_manage_language");

    if (!Translator.get(newLang))
        return translator.translate("errors.invalid_language");

    if (msg.guildId)
        data.guilds[msg.guildId].language = newLang;
    else
        data.users[msg.author.id].language = newLang;
}

const command: Command = {
    name: "lang",
    args: [1, 1, "<newLang>"],
    func: lang,
    alwaysReactOnSuccess: true,
}
export default command;
