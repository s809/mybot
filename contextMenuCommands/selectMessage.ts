import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, MessageContextMenuCommandInteraction, messageLink } from "discord.js";
import { getRuntimeGuildData } from "../env";
import { ContextMenuCommandDefinition } from "../modules/commands/contextMenuCommands";

const command: ContextMenuCommandDefinition<MessageContextMenuCommandInteraction> = {
    key: "selectMessage",
    type: ApplicationCommandType.Message,

    handler: async (interaction, translator) => {
        const range = getRuntimeGuildData(interaction.guild!)
            .channels.getOrSet(interaction.channelId, {
                members: new Map()
            })
            .members.getOrSet(interaction.user.id, {
                messageSelectionRange: {
                    begin: interaction.targetId,
                    end: interaction.targetId
                }
            })
            .messageSelectionRange!;
        
        if (interaction.targetId > range.begin)
            range.end = interaction.targetId;
        else
            range.begin = interaction.targetId;
        
        await interaction.reply({
            content: translator.translate("strings.selected") + "\n" + (range.begin !== range.end
                ? translator.translate("strings.message_id_range", range.begin, range.end)
                : translator.translate("strings.message_id", range.begin)),
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(range.begin !== range.end
                        ? [
                            new ButtonBuilder()
                                .setLabel(translator.translate("strings.begin_message"))
                                .setStyle(ButtonStyle.Link)
                                .setURL(messageLink(interaction.channelId, range.begin)),
                            new ButtonBuilder()
                                .setLabel(translator.translate("strings.end_message"))
                                .setStyle(ButtonStyle.Link)
                                .setURL(messageLink(interaction.channelId, range.end))
                        ]
                        : [
                            new ButtonBuilder()
                                .setLabel(translator.translate("strings.message"))
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
