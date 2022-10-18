import { ApplicationCommandData, MessageContextMenuCommandInteraction, Snowflake, UserContextMenuCommandInteraction } from "discord.js";
import { pathToFileURL } from "url";
import { botDirectory, defaults } from "../../constants";
import { PrefixedTranslator, Translator } from "../misc/Translator";
import { importModules } from "./importHelper";

var commands = new Map<Snowflake, ContextMenuCommand>();

type AllowedCommandTypes = UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction;
export interface ContextMenuCommandDefinition<T extends AllowedCommandTypes = AllowedCommandTypes> {
    key: string;
    type: T["commandType"];
    handler: (interaction: T, translator: PrefixedTranslator) => void;
}

export interface ContextMenuCommand<T extends AllowedCommandTypes = AllowedCommandTypes> extends ContextMenuCommandDefinition<T> {
    appCommandId: Snowflake | null;
    appCommandData: ApplicationCommandData;
}

export async function getContextMenuCommandData(): Promise<ContextMenuCommand[]> {
    if (commands.size)
        return [...commands.values()];

    const definitions = await importModules<ContextMenuCommandDefinition>(pathToFileURL(botDirectory + "/contextMenuCommands/foo").toString());
    return definitions.map(definition => {
        const nameLocalizations = Translator.getLocalizations(`contextMenuCommands.${definition.key}.name`);
        if (!nameLocalizations[defaults.locale])
            throw new Error(`Context menu command ${definition.key} has no name in default locale.`);
        
        return {
            ...definition,
            appCommandId: null,
            appCommandData: {
                type: definition.type,
                name: nameLocalizations[defaults.locale],
                nameLocalizations
            }
        };
    });
}

export function setContextMenuCommands(items: ContextMenuCommand[]) {
    commands = new Map(items.map(command => [command.appCommandId!, command]));
}

export function resolveContextMenuCommand(id: Snowflake) {
    return commands.get(id);
}
