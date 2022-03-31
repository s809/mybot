import { Message, User } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { resolveFlaggableItem } from "../../modules/data/flags";

async function flagList(msg: Message, id: string) {
    let resolvedItem = await resolveFlaggableItem(msg, id);

    if (!resolvedItem)
        return "Unknown item.";

    let flagStr = resolvedItem.dataEntry.flags.join("\n");
    if (!flagStr.length)
        flagStr = "None";

    await msg.channel.send({
        embeds: [{
            title: `Flags of ${resolvedItem.item instanceof User ? resolvedItem.item.tag : resolvedItem.item.name}`,
            description: flagStr
        }]
    });
}

const command: Command = {
    name: "list",
    args: [1, 1, "<id>"],
    func: flagList
};
export default command;
