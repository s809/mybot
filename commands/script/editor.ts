import { ButtonBuilder, SelectMenuBuilder, TextInputBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonInteraction, ButtonStyle, codeBlock, Message, ModalSubmitInteraction, SelectMenuInteraction, TextInputStyle } from "discord.js";
import { ScriptList } from "../../database/models";
import { client } from "../../env";
import { log } from "../../log";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { botEval } from "../../modules/misc/eval";
import { doRestart } from "../../modules/misc/restart";
import { ScriptContext } from "../../modules/misc/ScriptContext";

const startupListName = "startup";

async function scriptEditor(msg: CommandMessage) {
    const categories = await ScriptList.find();
    let list = categories[0];
    let name: string | undefined;
    let value: string | undefined;
    let context: ScriptContext | null;

    const getNameOptions = () => {
        let options = [...list.items.keys()].map(key => ({
            value: key,
            label: key,
            default: key == name
        }));
        options.push({
            value: "_create_new",
            label: "Create new...",
            default: false
        });
        return options;
    };

    const getOptions = () => {
        if (!name || !list.items.has(name))
            name = list.items.entries().next().value?.[0];
        if (name)
            value = list.items.get(name);

        context = name
            ? ScriptContext.get(`${list._id}/${name}`)
            : null;

        return {
            embeds: [name
                ? {
                    title: `Script editor: ${name}` + (context
                        ? (list.id === startupListName ? "" : " (running)")
                        : list.id === startupListName ? " (stopped)" : ""),
                    description: codeBlock("js", value!)
                }
                : {
                    title: "Script editor",
                    description: "No script selected"
                }
            ],
            components: [
                new ActionRowBuilder<SelectMenuBuilder>()
                    .addComponents([
                        new SelectMenuBuilder()
                            .setCustomId("type")
                            .setOptions(categories.map(key => ({
                                value: key.id,
                                label: key.id,
                                default: key.id === list.id
                            })))
                    ]),
                new ActionRowBuilder<SelectMenuBuilder>()
                    .addComponents([
                        new SelectMenuBuilder()
                            .setCustomId("name")
                            .setOptions(getNameOptions())
                    ]),
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId("edit")
                            .setLabel("Edit")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!name),
                        ...(list.id === startupListName
                            ? [new ButtonBuilder()
                                .setCustomId("reload")
                                .setLabel("Reload")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(!name)]
                            : []),
                        new ButtonBuilder()
                            .setCustomId("stop")
                            .setLabel("Stop")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!context),
                        new ButtonBuilder()
                            .setCustomId("delete")
                            .setLabel("Delete")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(!name),
                        new ButtonBuilder()
                            .setCustomId("restart")
                            .setLabel("Restart")
                            .setStyle(ButtonStyle.Secondary)
                    ])
            ]
        }
    };

    let message = await msg.reply(getOptions());

    let createNew: boolean;
    let onModalSubmit = async (interaction: ModalSubmitInteraction) => {
        const newName = interaction.fields.getTextInputValue("name");

        if (!createNew && newName !== name) {
            list.items.delete(name!);
            context?.rename(`${list._id}/${newName}`);
        }
        list.items.set(newName, interaction.fields.getTextInputValue("content"));
        await list.save();
        name = newName;

        await (interaction as any).update(getOptions()); // TODO remove cast once typings are added
    }

    let createModal = async (interaction: SelectMenuInteraction | ButtonInteraction) => {
        await interaction.showModal({
            custom_id: "script_editor",
            title: createNew ? "Create script" : `Edit ${name}`,
            components: [
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents([
                        new TextInputBuilder()
                            .setCustomId("name")
                            .setLabel("Name")
                            .setStyle(TextInputStyle.Short)
                            .setValue(createNew ? "" : name!)
                    ])
                    .toJSON(),
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents([
                        new TextInputBuilder()
                            .setCustomId("content")
                            .setLabel("Script code")
                            .setStyle(TextInputStyle.Paragraph)
                            .setValue(createNew ? "" : value!)
                    ]).toJSON()
            ]
        });
    }

    const collector = message.createMessageComponentCollector({
        idle: 2147483647,
    })
        .on("collect", async interaction => {
            if (interaction.user !== msg.author) {
                await interaction.reply({
                    content: "Nothing for you here.",
                    ephemeral: true
                });
                return;
            }

            if (interaction instanceof SelectMenuInteraction) {
                if (interaction.values[0] === "_create_new") {
                    // duct tape on shitty android discord version
                    await message.edit(getOptions());

                    createNew = true;
                    await createModal(interaction);

                    await interaction.awaitModalSubmit({
                        time: 600000
                    }).then(onModalSubmit);
                } else {
                    switch (interaction.customId) {
                        case "type":
                            list = categories.find(x => x.id === interaction.values[0])!;
                            name = ""; // will be reset in getOptions
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
                        createNew = false;
                        await createModal(interaction);

                        await interaction.awaitModalSubmit({
                            time: 600000
                        }).then(onModalSubmit).catch(() => { });
                        break;
                    case "reload":
                        context?.destroy();

                        const result = await botEval(value!, null, `${list._id}/${name}`);
                        log(`Executed ${name}:\n${result}`);

                        if (result === "undefined") {
                            await interaction.update(getOptions());
                        } else {
                            await message.edit(getOptions());
                            await interaction.reply({
                                embeds: [{
                                    description: codeBlock("js", result)
                                }],
                                ephemeral: true
                            });
                        }
                        break;
                    case "stop":
                        context!.destroy();

                        await interaction.update(getOptions());
                        break;
                    case "delete":
                        context?.destroy();
                        list.items.delete(name!);

                        await Promise.all([
                            list.save(),
                            interaction.update(getOptions())
                        ]);
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
        })
        .on("end", () => {
            client.off("messageCreate", event);
        });

    const event = (message: Message) => {
        if (message.channelId === msg.channelId) {
            collector.resetTimer({
                idle: 600000
            });
            client.off("messageCreate", event);
        }
    };
    client.on("messageCreate", event);
}

const command: CommandDefinition = {
    key: "editor",
    handler: scriptEditor
};
export default command;
