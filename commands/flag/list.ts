import { ApplicationCommandOptionType, User } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { FlaggableType, resolveFlaggableItem, flaggableTypeChoices } from "../../modules/data/flags";

async function flagList(msg: CommandMessage, {
    type,
    id
}: {
    type: FlaggableType,
    id: string;
}) {
    const resolvedItem = await resolveFlaggableItem(type, id);

    if (!resolvedItem[0])
        return "Unknown item.";

    await msg.reply({
        embeds: [{
            title: `Flags of ${resolvedItem[0] instanceof User ? resolvedItem[0].tag : resolvedItem[0].name}`,
            description: resolvedItem[1]?.flags.join("\n") || "None"
        }]
    });
}

const command: CommandDefinition = {
    key: "list",
    args: [{
        translationKey: "type",
        type: ApplicationCommandOptionType.String,
        choices: flaggableTypeChoices
    }, {
        translationKey: "id",
        type: ApplicationCommandOptionType.String,
    }],
    handler: flagList
};
export default command;
