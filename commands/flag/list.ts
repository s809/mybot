import { ApplicationCommandOptionType, User } from "discord.js";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { resolveFlaggableItem } from "../../modules/data/flags";

async function flagList(msg: CommandMessage, {
    id
}: {
    id: string;
}) {
    let resolvedItem = await resolveFlaggableItem(msg.message!, id);

    if (!resolvedItem)
        return "Unknown item.";

    let flagStr = resolvedItem.dataEntry.flags.join("\n");
    if (!flagStr.length)
        flagStr = "None";

    await msg.reply({
        embeds: [{
            title: `Flags of ${resolvedItem.item instanceof User ? resolvedItem.item.tag : resolvedItem.item.name}`,
            description: flagStr
        }]
    });
}

const command: CommandDefinition = {
    key: "list",
    args: [{
        translationKey: "id",
        type: ApplicationCommandOptionType.String,
    }],
    handler: flagList
};
export default command;
