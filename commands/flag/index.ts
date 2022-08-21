import { ApplicationCommandOptionType, Message } from "discord.js";
import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { BotOwner } from "../../modules/commands/requirements";
import { resolveFlaggableItem, toggleFlag } from "../../modules/data/flags";

async function flag(msg: CommandMessage, id: string, flag: string) {
    let resolvedItem = await resolveFlaggableItem(msg.message!, id);

    if (!resolvedItem)
        return "Unknown item.";

    toggleFlag(resolvedItem.dataEntry, flag);
}

const command: CommandDefinition = {
    key: "flag",
    args: [{
        translationKey: "id",
        type: ApplicationCommandOptionType.String,
    }, {
        translationKey: "flag",
        type: ApplicationCommandOptionType.String,
    }],
    requirements: BotOwner,
    alwaysReactOnSuccess: true,
    handler: flag,
    subcommands: await importCommands(import.meta.url)
};
export default command;
