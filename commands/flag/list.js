import { Message } from "discord.js";
import { resolveItem } from "../../modules/data/flags.js";

/**
 * @param {Message} msg
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function flagList(msg, id) {
    let resolvedItem = await resolveItem(msg, id);

    if (!resolvedItem)
        return "Unknown item.";

    let flagStr = resolvedItem.dataEntry.flags.join("\n");
    if (!flagStr.length)
        flagStr = "None";

    await msg.channel.send({
        embeds: [{
            title: `Flags of ${resolvedItem.item.name ?? resolvedItem.item.tag}`,
            description: flagStr
        }]
    });
}

export const name = "list";
export const description = "get flags of specific item";
export const args = "<id>";
export const minArgs = 1;
export const maxArgs = 1;
export const func = flagList;
