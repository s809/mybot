import { Message } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { BotOwner } from "../../modules/commands/requirements";
import { resolveFlaggableItem, toggleFlag } from "../../modules/data/flags";

async function flag(msg: Message, id: string, flag: string) {
    let resolvedItem = await resolveFlaggableItem(msg, id);

    if (!resolvedItem)
        return "Unknown item.";

    toggleFlag(resolvedItem.dataEntry, flag);
}

const command: CommandDefinition = {
    name: "flag",
    args: [2, 2, "<id> <flag>"],
    requirements: BotOwner,
    alwaysReactOnSuccess: true,
    func: flag,
    subcommands: await importCommands(import.meta.url)
};
export default command;
