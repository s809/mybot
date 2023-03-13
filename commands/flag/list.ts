import { ApplicationCommandOptionType, User } from "discord.js";
import { CommandRequest, CommandDefinition } from "@s809/noisecord";
import { FlaggableType, getItemForFlags, flaggableTypeChoices } from "../../modules/data/flags";

async function flagList(msg: CommandRequest, {
    type,
    id
}: {
    type: FlaggableType,
    id: string;
}) {
    const resolvedItem = await getItemForFlags(type, id);

    if (!resolvedItem)
        return "Unknown item.";

    await msg.reply({
        embeds: [{
            title: `Flags of ${resolvedItem.item instanceof User ? resolvedItem.item.tag : resolvedItem.item.name}`,
            description: resolvedItem?.data.flags.join("\n") || "None"
        }]
    });
}

const command: CommandDefinition = {
    key: "list",
    args: [{
        key: "type",
        type: ApplicationCommandOptionType.String,
        choices: flaggableTypeChoices
    }, {
        key: "id",
        type: ApplicationCommandOptionType.String,
    }],
    handler: flagList
};
export default command;
