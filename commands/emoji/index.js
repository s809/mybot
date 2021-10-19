import { Permissions } from "discord.js";
import { importCommands } from "../../modules/commands/importHelper.js";

export const name = "emoji";
export const managementPermissionLevel = Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS;
export const subcommands = await importCommands(import.meta.url);
