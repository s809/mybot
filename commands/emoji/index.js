import { importCommands } from "../../modules/commands/importHelper.js";

export const name = "emoji";
export const subcommands = await importCommands(import.meta.url);
