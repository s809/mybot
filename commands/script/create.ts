import { Message } from "discord.js";
import { data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { getPrefix } from "../../modules/data/getPrefix";
import { skipStringAfter, wrapInQuotesIfNeed } from "../../util";

async function createScript(msg: Message, type: string, scriptName: string) {
    if (!(type in data.scripts))
        return "Invalid script type.";

    if (scriptName.match(/[/\\]/))
        return "Invalid script name.";

    if (scriptName in data.scripts[type])
        return "Script with this name already exists.";

    data.scripts[type][scriptName] = skipStringAfter(msg.content,
        getPrefix(msg.guildId),
        type,
        wrapInQuotesIfNeed(scriptName)
    );
}

const command: Command = {
    name: "create",
    args: [2, Infinity, "<category> <name> <code...>"],
    func: createScript
};
export default command;
