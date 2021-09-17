import { importCommands } from "../../modules/commands/importHelper.js";

export const name = "bot";
export const subcommands = await importCommands(import.meta.url);
