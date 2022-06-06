import { ButtonBuilder, SelectMenuBuilder, TextInputBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonInteraction, ButtonStyle, Formatters, Message, ModalSubmitInteraction, SelectMenuInteraction, TextInputStyle } from "discord.js";
import { data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { botEval } from "../../modules/misc/eval";
import { doRestart } from "../../modules/misc/restart";
import { ScriptContext } from "../../modules/misc/ScriptContext";

async function scriptEditor(msg: Message) {
    let type = Object.keys(data.scripts)[0];
    let name = Object.keys(data.scripts[type])[0];
    let context = name ? ScriptContext.get(`${type}/${name}`) : null;

    let getNameOptions = () => {
        let options = Object.keys(data.scripts[type]).map(key => ({
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

    let getOptions = () => ({
        embeds: [name && data.scripts[type][name]
            ? {
                title: `Script editor: ${name}` + (context
                    ? (type === "startup" ? "" : " (running)")
                    : type === "startup" ? " (stopped)" : ""),
                description: Formatters.codeBlock("js", data.scripts[type][name])
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
                        .setOptions(Object.keys(data.scripts).map(key => ({
                            value: key,
                            label: key,
                            default: key == type
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
                        .setDisabled(!data.scripts[type][name]),
                    ...(type === "startup"
                        ? [new ButtonBuilder()
                            .setCustomId("reload")
                            .setLabel("Reload")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!data.scripts[type][name])]
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
                        .setDisabled(!data.scripts[type][name]),
                    new ButtonBuilder()
                        .setCustomId("restart")
                        .setLabel("Restart")
                        .setStyle(ButtonStyle.Secondary)
                ])
        ]
    });

    let message = await msg.channel.send(getOptions());

    let createNew: boolean;
    let onModalSubmit = async (interaction: ModalSubmitInteraction) => {
        let newName = interaction.fields.getTextInputValue("name");

        data.scripts[type][newName] = interaction.fields.getTextInputValue("content");
        if (!createNew && newName !== name) {
            delete data.scripts[type][name];
            context.rename(`${type}/${newName}`);
        }
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
                            .setValue(createNew ? "" : name)
                    ])
                    .toJSON(),
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents([
                        new TextInputBuilder()
                            .setCustomId("content")
                            .setLabel("Script code")
                            .setStyle(TextInputStyle.Paragraph)
                            .setValue(createNew ? "" : data.scripts[type][name])
                    ]).toJSON()
            ]
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
                        type = interaction.values[0];
                        name = Object.keys(data.scripts[type])[0];
                        break;
                    case "name":
                        name = interaction.values[0];
                        break;
                }
                
                context = name ? ScriptContext.get(`${type}/${name}`) : null;
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

                    let result = await botEval(data.scripts[type][name], null, `${type}/${name}`);
                    console.log(`Executed ${name}:\n${result}`);
                    context = ScriptContext.get(`${type}/${name}`);
                    
                    await interaction.update(getOptions());
                    break;
                case "stop":
                    context.destroy();
                    context = null;

                    await interaction.update(getOptions());
                    break;
                case "delete":
                    context?.destroy();
                    delete data.scripts[type][name];
                    
                    name = Object.keys(data.scripts[type])[0];
                    context = name ? ScriptContext.get(`${type}/${name}`) : null;

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
    });
}

const command: Command = {
    name: "editor",
    func: scriptEditor
};
export default command;
