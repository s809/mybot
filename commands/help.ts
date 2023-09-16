import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import assert from "assert";
import { APIEmbed, ComponentType, MessageSelectOption, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { PreparedTranslation, Translatable, defineCommand } from "@s809/noisecord";
import { Command } from "@s809/noisecord";
import { getPrefix } from "../modules/data/getPrefix";
import { commandFramework, isBotOwner } from "../env";
import { defaults } from "../constants";

export default defineCommand({
    key: "help",
    defaultMemberPermissions: PermissionFlagsBits.UseApplicationCommands,

    translations: {
        embeds: {
            select_command_menu: true,
            title: true,
            select_command: true,
            no_description: true,
            select_command_in_category: true,
            slash_commands_suggestion: true,
            required_permissions: true
        },
        errors: {
            send_your_own_command: true
        }
    },

    handler: async (msg, { }, { embeds, errors }) => {
        let translator = msg.translator;
        const isBotOwnerResult = await isBotOwner(msg.author);

        const filterCommands = (list: Command[]) =>
            list.filter(command => !command.ownerOnly || (isBotOwnerResult && msg.channel.isDMBased()));

        let levelNameToPosition: Map<string, number> = new Map();
        let chain: {
            row: ActionRowBuilder<SelectMenuBuilder>;
            selectMenu: SelectMenuBuilder;
            commands: Map<string, Command>;
            selectOptions: MessageSelectOption[];
        }[] = [];

        let pushToChain = (commands: Command[]) => {
            const levelName = `level${chain.length}`;

            let selectOptions = commands.map(x => ({
                label: translator.getTranslationFromRecord(x.nameTranslations),
                value: `${levelName}_${x.key}`,
                default: false,
            }));

            let selectMenu = new SelectMenuBuilder()
                .setCustomId(levelName)
                .setPlaceholder(embeds.select_command_menu.translate())
                .setOptions(selectOptions);

            let row = new ActionRowBuilder<SelectMenuBuilder>()
                .setComponents([selectMenu]);

            levelNameToPosition.set(levelName, chain.length);
            chain.push({
                row: row,
                selectMenu: selectMenu,
                commands: new Map(commands.map((x, i) => [selectOptions[i].value, x])),
                selectOptions: selectOptions as MessageSelectOption[]
            });
        };
        let popFromChain = (toPos: number) => {
            for (let [key, value] of levelNameToPosition) {
                if (value > toPos)
                    levelNameToPosition.delete(key);
            }
            chain.splice(toPos + 1);
        };
        pushToChain(filterCommands([...commandFramework.commandRegistry!.commands.values()]));

        const makeOptions = async (command: Command | null) => {
            let embed: Translatable.Value<APIEmbed>;

            if (!command) {
                embed = {
                    title: embeds.title,
                    description: embeds.select_command
                };
            } else {
                let codeBlock = `\`\`\`\n${commandFramework.commandRegistry?.getCommandUsageString(command, await getPrefix(msg.guildId), translator.root!)}\`\`\`\n`;
                let description = command.descriptionTranslations[translator.localeString]
                    ?? command.descriptionTranslations[defaults.locale]
                    ?? embeds.no_description;

                embed = {
                    title: embeds.title,
                    description: (command.handler
                        ? codeBlock + description
                        : embeds.select_command_in_category),
                    footer: command.handler && command.interactionCommand
                        ? {
                            text: embeds.slash_commands_suggestion
                        }
                        : undefined
                };
            }

            return {
                embeds: [Translatable.translateValue<APIEmbed>(embed)],
                components: chain.map(x => new ActionRowBuilder<SelectMenuBuilder>()
                    .setComponents([x.selectMenu]))
            };
        };

        let resp = await msg.replyOrEdit(await makeOptions(null));

        resp.createMessageComponentCollector({
            idle: 60000,
            dispose: true,
            componentType: ComponentType.StringSelect
        }).on("collect", async (interaction: StringSelectMenuInteraction) => {
            if (interaction.user != msg.author) {
                interaction.reply({
                    content: errors.send_your_own_command.withArgs({
                        prefix: await getPrefix(msg.guildId),
                        name: "help"
                    }).translate(),
                    ephemeral: true
                });
                return;
            }

            let pos = levelNameToPosition.get(interaction.customId)!;
            if (pos < chain.length - 1)
                popFromChain(pos);

            let entry = chain[pos];
            let command = entry.commands.get(interaction.values[0])!;
            let subcommands = command.subcommands;
            if (subcommands) {
                let filtered = filterCommands([...subcommands.values()])
                if (filtered.length)
                    pushToChain(filtered);
                else
                    assert(command.handler, `Category without visible subcommands\nCommand: ${command.path}`)
            }

            for (const option of entry.selectMenu.options)
                option.setDefault(option.data.value === interaction.values[0]);

            await interaction.update(await makeOptions(command));
        }).on("end", () => {
            resp.delete();
        });
    }
});