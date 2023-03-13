import { ApplicationCommandOptionType } from "discord.js";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { FlaggableType, getItemForFlags, flaggableTypeChoices, toggleFlag } from "../../modules/data/flags";

async function flag(msg: CommandRequest, {
    type,
    id,
    flag
}: {
    type: FlaggableType;
    id: string;
    flag: string;
}) {
    const resolvedItem = await getItemForFlags(type, id);
    if (!resolvedItem)
        return "Unknown item.";

    await toggleFlag(resolvedItem.item, flag);
}

export default defineCommand({
    key: "toggle",
    args: [{
        key: "type",
        type: ApplicationCommandOptionType.String,
        choices: flaggableTypeChoices
    }, {
        key: "id",
        type: ApplicationCommandOptionType.String,
    }, {
        key: "flag",
        type: ApplicationCommandOptionType.String,
    }],
    handler: flag
});

