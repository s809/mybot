import { ApplicationCommandOptionType } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { resolveFlaggableItem, toggleFlag } from "../../modules/data/flags";

async function flag(msg: CommandMessage, {
    id,
    flag
}: {
    id: string;
    flag: string;
}) {
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
    ownerOnly: true,
    alwaysReactOnSuccess: true,
    handler: flag,
    subcommands: await importCommands(import.meta.url)
};
export default command;
