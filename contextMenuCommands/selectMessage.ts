import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, Interaction, InteractionResponse, MessageContextMenuCommandInteraction, messageLink } from "discord.js";
import { commandFramework, runtimeGuildData } from "../env";
import { defineContextMenuCommand } from "@s809/noisecord";

const strings = commandFramework.translationChecker.checkTranslations({
    selected: true,
    message_id_range: true,
    message_id: true,
    begin_message: true,
    end_message: true,
    message: true,
    remove_selection: true
}, `${commandFramework.commandRegistry.getCommandTranslationPath("selectMessage", true)}.strings`);

export default defineContextMenuCommand({
    key: "selectMessage",
    type: ApplicationCommandType.Message,
    allowDMs: false,

    handler: async (interaction, translator) => {
        const range = runtimeGuildData.get(interaction.guildId)
            .channels.get(interaction.channelId)
            .members.get(interaction.user.id)
            .messageSelectionRange ??= {
            begin: interaction.targetId,
            end: interaction.targetId
        };
        
        if (range.lastInteraction)
            range.lastInteraction.deleteReply().catch(() => { });
        range.lastInteraction = interaction;

        if (interaction.targetId > range.begin)
            range.end = interaction.targetId;
        else
            range.begin = interaction.targetId;

        const result = await interaction.reply({
            content: strings.selected.getTranslation(translator) + "\n" + (range.begin !== range.end
                ? strings.message_id_range.getTranslation(translator, {
                    startId: range.begin,
                    endId: range.end
                })
                : strings.message_id.getTranslation(translator, { id: range.begin })),
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        ...range.begin !== range.end
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
                            ],
                        new ButtonBuilder()
                            .setLabel(strings.remove_selection.getTranslation(translator))
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId("remove_selection")
                    ])
            ],
            ephemeral: true
        });

        result.createMessageComponentCollector({
            componentType: ComponentType.Button,
            idle: 120000
        }).on("collect", async buttonInteraction => {
            if (buttonInteraction.customId === "remove_selection") {
                delete runtimeGuildData.get(interaction.guildId)
                    .channels.get(interaction.channelId)
                    .members.get(interaction.user.id)
                    .messageSelectionRange;
                await interaction.deleteReply();
            }
        });
    }
});
