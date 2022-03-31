import { Message } from "discord.js";
import { data } from "../../env";
import { Command } from "../../modules/commands/definitions";

async function deleteScript(msg: Message, type: string, name: string) {
    if (!(type in data.scripts))
        return "Invalid script type.";

    if (name.match(/[/\\]/))
        return "Invalid script name.";

    if (!(name in data.scripts[type]))
        return "Script with this name does not exist.";

    delete data.scripts[type][name];
}

const command: Command = {
    name: "delete",
    args: [2, 2, "<category> <name>"],
    func: deleteScript
};
export default command;
