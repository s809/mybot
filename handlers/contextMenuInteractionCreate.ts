import { client } from "../env";
import { resolveContextMenuCommand } from "../modules/commands/contextMenuCommands";
import { Translator } from "../modules/misc/Translator";

client.on('interactionCreate', async interaction => {
    if (!interaction.isContextMenuCommand()) return;
    const translator = await Translator.getOrDefault(interaction, "command_processor");

    const command = resolveContextMenuCommand(interaction.command!.id);
    if (!command) {
        await interaction.reply(translator.translate("errors.unknown_command"));
        return;
    }
    
    command.handler(interaction, await Translator.getOrDefault(interaction, `contextMenuCommands.${command.key}`));
});
