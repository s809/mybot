import { Message } from "discord.js";
import { CommandManagementPermissionLevel } from "../../modules/commands/definitions.js";
import { importCommands } from "../../modules/commands/importHelper.js";
import { resolveItem, toggleFlag } from "../../modules/data/flags.js";

/**
 * @param {Message} msg
 * @param {string} id
 * @param {string} commandPath
 */
async function flag(msg, id, flag) {
    let resolvedItem = await resolveItem(msg, id);

    if (!resolvedItem)
        return "Unknown item.";

    toggleFlag(resolvedItem.dataEntry, flag);
}

export const name = "flag";
export const description = "toggle flags of specific item";
export const args = "<id> <flag>";
export const minArgs = 2;
export const maxArgs = 2;
export const managementPermissionLevel = CommandManagementPermissionLevel.BOT_OWNER;
export const func = flag;
export const subcommands = await importCommands(import.meta.url);
