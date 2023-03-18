import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, MessageContextMenuCommandInteraction, messageLink } from "discord.js";
import { commandFramework, runtimeGuildData } from "../env";
import { ContextMenuCommandDefinition } from "@s809/noisecord";

const strings = commandFramework.translationChecker.checkTranslations({
    selected: true,
    message_id_range: true,
    message_id: true,
    begin_message: true,
    end_message: true,
    message: true
}, `${commandFramework.commandRegistry.getCommandTranslationPath("selectMessage", true)}.strings`);

const command: ContextMenuCommandDefinition<MessageContextMenuCommandInteraction> = {
    key: "selectMessage",
    type: ApplicationCommandType.Message,

    handler: async (interaction, translator) => {
        const range = runtimeGuildData.getOrSetDefault(interaction.guildId!)
            .channels.getOrSetDefault(interaction.channelId)
            .members.getOrSetDefault(interaction.user.id)
            .messageSelectionRange ??= {
                begin: interaction.targetId,
                end: interaction.targetId
            };
        
        if (interaction.targetId > range.begin)
            range.end = interaction.targetId;
        else
            range.begin = interaction.targetId;
        
        await interaction.reply({
            content: strings.selected.getTranslation(translator) + "\n" + (range.begin !== range.end
                ? strings.message_id_range.getTranslation(translator, {
                    startId: range.begin,
                    endId: range.end
                })
                : strings.message_id.getTranslation(translator, { id: range.begin })),
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(range.begin !== range.end
                        ? [
                            new ButtonBuilder()
                                .setLabel(strings.begin_message.getTranslation(translator))
                                .setStyle(ButtonStyle.Link)
                                .setURL(messageLink(interaction.channelId, range.begin)),
                            new ButtonBuilder()
                                .setLabel(strings.end_message.getTranslation(translator))
                                .setStyle(ButtonStyle.Link)
                                .setURL(messageLink(interaction.channelId, range.end))
                        ]
                        : [
                            new ButtonBuilder()
                                .setLabel(strings.message.getTranslation(translator))
                                .setStyle(ButtonStyle.Link)
                                .setURL(messageLink(interaction.channelId, range.begin)),
                        ]
                    )
            ],
            ephemeral: true
        })
    }
};
export default command;
