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

    handler: async req => {
        const range = runtimeGuildData.get(req.guildId)
            .channels.get(req.channelId)
            .members.get(req.author.id)
            .messageSelectionRange ??= {
            begin: req.interaction.targetId,
            end: req.interaction.targetId
        };
        
        if (range.lastRequest)
            range.lastRequest.response.delete();
        range.lastRequest = req;

        if (req.interaction.targetId > range.begin)
            range.end = req.interaction.targetId;
        else
            range.begin = req.interaction.targetId;

        const result = await req.replyOrEdit({
            content: strings.selected.getTranslation(req.translator) + "\n" + (range.begin !== range.end
                ? strings.message_id_range.getTranslation(req.translator, {
                    startId: range.begin,
                    endId: range.end
                })
                : strings.message_id.getTranslation(req.translator, { id: range.begin })),
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        ...range.begin !== range.end
                            ? [
                                new ButtonBuilder()
                                    .setLabel(strings.begin_message.getTranslation(req.translator))
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(messageLink(req.channelId, range.begin)),
                                new ButtonBuilder()
                                    .setLabel(strings.end_message.getTranslation(req.translator))
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(messageLink(req.channelId, range.end))
                            ]
                            : [
                                new ButtonBuilder()
                                    .setLabel(strings.message.getTranslation(req.translator))
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(messageLink(req.channelId, range.begin)),
                            ],
                        new ButtonBuilder()
                            .setLabel(strings.remove_selection.getTranslation(req.translator))
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
                delete runtimeGuildData.get(req.guildId)
                    .channels.get(req.channelId)
                    .members.get(req.author.id)
                    .messageSelectionRange;
                await req.response.delete();
            }
        });
    }
});
