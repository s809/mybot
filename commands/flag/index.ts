import { ApplicationCommandOptionType } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { FlaggableType, resolveFlaggableItem, toggleFlag, flaggableTypeChoices } from "../../modules/data/flags";

async function flag(msg: CommandMessage, {
    type,
    id,
    flag
}: {
    type: FlaggableType;
    id: string;
    flag: string;
}) {
    const resolvedItem = await resolveFlaggableItem(type, id);

    if (!resolvedItem[1])
        return "Unknown item.";

    toggleFlag(resolvedItem[1], flag);
}

const command: CommandDefinition = {
    key: "flag",
    args: [{
        translationKey: "type",
        type: ApplicationCommandOptionType.String,
        choices: flaggableTypeChoices
    }, {
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
