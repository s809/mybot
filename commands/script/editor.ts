import { APITextInputComponent } from "discord-api-types/v10";
import { TextInputStyle } from "discord-api-types/v9";
import { Modal, ModalData, ModalSubmitInteraction, showModal, TextInputComponent } from "discord-modals";
import { ButtonInteraction, Formatters, Interaction, Message, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import { client, data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { doRestart } from "../../modules/misc/restart";

async function scriptEditor(msg: Message) {
    let type = Object.keys(data.scripts)[0];
    let name = Object.keys(data.scripts[type])[0];

    let getNameOptions = () => {
        let options = Object.keys(data.scripts[type]).map(key => ({
            value: key,
            label: key,
            default: key == name
        } as MessageSelectOptionData));
        options.push({
            value: "_create_new",
            label: "Create new...",
            default: false
        });
        return options;
    };

    let getOptions = () => ({
        embeds: [{
            title: "Script editor" + (name ? ": " + name : ""),
            description: data.scripts[type][name]
                ? Formatters.codeBlock("js", data.scripts[type][name])
                : "No script selected"
        }],
        components: [
            new MessageActionRow({
                components: [
                    new MessageSelectMenu({
                        customId: "type",
                        options: Object.keys(data.scripts).map(key => ({
                            value: key,
                            label: key,
                            default: key == type
                        } as MessageSelectOptionData))
                    })
                ]
            }),
            new MessageActionRow({
                components: [
                    new MessageSelectMenu({
                        customId: "name",
                        options: getNameOptions()
                    })
                ]
            }),
            new MessageActionRow({
                components: [
                    new MessageButton({
                        customId: "edit",
                        label: "Edit",
                        style: "PRIMARY",
                        disabled: !data.scripts[type][name]
                    }),
                    new MessageButton({
                        customId: "delete",
                        label: "Delete",
                        style: "DANGER",
                        disabled: !data.scripts[type][name]
                    }),
                    new MessageButton({
                        customId: "restart",
                        label: "Restart bot",
                        style: "SECONDARY"
                    })
                ]
            })
        ]
    });

    let message = await msg.channel.send(getOptions());
    
    let onModalSubmit = async (interaction: ModalSubmitInteraction) => {
        if (interaction.customId !== "script_editor") return;
        name = interaction.getTextInputValue("name") ?? name;
        
        data.scripts[type][name] = interaction.getTextInputValue("content");
        await message.edit(getOptions());

        await interaction.deferReply({
            ephemeral: true
        });
        await interaction.followUp({
            content: "Saved.",
            ephemeral: true
        });
    }
    client.on("modalSubmit", onModalSubmit);

    let createModal = async (interaction: Interaction, createNew: boolean) => {
        let modal: Modal;
        if (createNew) { 
            modal = new Modal({
                custom_id: "script_editor",
                title: "Create script"
            } as ModalData).addComponents(new TextInputComponent({
                custom_id: "name",
                style: TextInputStyle.Short,
                label: "Name",
                value: "",
                required: true
            } as APITextInputComponent));
        } else {
            modal = new Modal({
                custom_id: "script_editor",
                title: `Edit ${name}`
            } as ModalData);
        }

        await showModal(modal.addComponents(new TextInputComponent({
            custom_id: "content",
            style: TextInputStyle.Paragraph,
            label: "Script code",
            value: !createNew ? data.scripts[type][name] : null,
            required: true
        } as APITextInputComponent)), {
            client: client,
            interaction: interaction
        });
    }

    message.createMessageComponentCollector({
        idle: 600000,
    }).on("collect", async interaction => {
        if (interaction.user !== msg.author) {
            await interaction.reply({
                content: "Nothing for you here.",
                ephemeral: true
            });
            return;
        }

        if (interaction instanceof SelectMenuInteraction) {
            if (interaction.values[0] === "_create_new") {
                await message.edit(getOptions());
                await createModal(interaction, true);
            } else {
                switch (interaction.customId) {
                    case "type":
                        type = interaction.values[0];
                        name = Object.keys(data.scripts[type])[0];
                        break;
                    case "name":
                        name = interaction.values[0];
                        break;
                }

                await interaction.update(getOptions());
            }
        }

        if (interaction instanceof ButtonInteraction) {
            switch (interaction.customId) {
                case "edit":
                    await createModal(interaction, false);
                    break;
                case "delete":
                    delete data.scripts[type][name];
                    await interaction.update(getOptions());
                    break;
                case "restart":
                    await interaction.deferReply({ ephemeral: true });
                    await doRestart(async () => {
                        await interaction.followUp({
                            content: "Bot is restarting.",
                            ephemeral: true
                        })
                    });
                    break;
            }
        }
    }).on("end", () => {
        client.off("modalSubmit", onModalSubmit);
    });
}

const command: Command = {
    name: "editor",
    func: scriptEditor
};
export default command;
