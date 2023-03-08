import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import assert from "assert";
import { APIEmbed, ComponentType, MessageSelectOption, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { CommandRequest } from "@s809/noisecord";
import { Command, CommandDefinition } from "@s809/noisecord";
import { getPrefix } from "../modules/data/getPrefix";
import { commandFramework, isBotOwner } from "../env";
import { defaults } from "../constants";

async function help(msg: CommandRequest) {
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
            .setPlaceholder(translator.translate("embeds.select_command_menu"))
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
        let embed: APIEmbed;

        if (!command) {
            embed = {
                title: translator.translate("embeds.title"),
                description: translator.translate("embeds.select_command")
            };
        } else {
            let codeBlock = `\`\`\`\n${commandFramework.commandRegistry?.getCommandUsageString(command, await getPrefix(msg.guildId), translator.root!)}\`\`\`\n`;
            let description = `${command.descriptionTranslations[translator.localeString]
                ?? command.descriptionTranslations[defaults.locale]
                ?? translator.translate("embeds.no_description")}`;
            let requiredPermissions = command.conditions.filter(x => !x.hideInDescription).map(x => x.name).join(", ");
            
            if (requiredPermissions)
                requiredPermissions = `\n${translator.translate("embeds.required_permissions", { requiredPermissions })}`;
            else
                requiredPermissions = "";

            embed = {
                title: translator.translate("embeds.title"),
                description: (command.handler
                    ? codeBlock + description
                    : translator.translate("embeds.select_command_in_category"))
                    + requiredPermissions,
                footer: command.handler && command.interactionCommand
                    ? {
                        text: translator.translate("embeds.slash_commands_suggestion")
                    }
                    : undefined
            };
        }

        return {
            embeds: [embed],
            components: chain.map(x => new ActionRowBuilder<SelectMenuBuilder>()
                .setComponents([x.selectMenu]))
        };
    };

    let resp = await msg.reply(await makeOptions(null));

    resp.createMessageComponentCollector({
        idle: 60000,
        dispose: true,
        componentType: ComponentType.StringSelect
    }).on("collect", async (interaction: StringSelectMenuInteraction) => {
        if (interaction.user != msg.author) {
            interaction.reply({
                content: translator.translate("errors.send_your_own_command", {
                    prefix: await getPrefix(msg.guildId),
                    name: "help"
                }),
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

const command: CommandDefinition = {
    key: "help",
    handler: help,
    defaultMemberPermissions: PermissionFlagsBits.UseApplicationCommands,
    interactionCommand: true
}
export default command;
