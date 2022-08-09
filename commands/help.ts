import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import assert, { fail } from "assert";
import { BitField, Message, MessageSelectOption, SelectMenuInteraction } from "discord.js";
import { snakeCase } from "lodash-es";
import { getRootCommands, toUsageString } from "../modules/commands";
import { Command } from "../modules/commands/definitions";
import { checkRequirementsBeforeRunning } from "../modules/commands/requirements";
import { getPrefix } from "../modules/data/getPrefix";
import { Translator } from "../modules/misc/Translator";
import { capitalizeWords } from "../util";

async function help(msg: Message) {
    let translator = Translator.get(msg);

    const filterCommands = (list: Command[]) =>
        list.filter(command => !checkRequirementsBeforeRunning(msg, command)?.hideCommand);

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
            label: x.name,
            value: `${levelName}_${x.name}`,
            default: false,
        }));

        let selectMenu = new SelectMenuBuilder()
            .setCustomId(levelName)
            .setPlaceholder(translator.translate("embeds.help.select_command_menu"))
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
    pushToChain(filterCommands(getRootCommands()));

    const makeOptions = (command: Command) => {
        let embed;

        if (!command) {
            embed = {
                title: translator.translate("embeds.help.title"),
                description: `${translator.translate("embeds.help.select_command")}`
            };
        } else {
            let codeBlock = `\`\`\`\n${toUsageString(msg, command)}\`\`\`\n`;
            let description = `${translator.tryTranslate("command_descriptions." + command.path.replaceAll("/", "_")) ?? translator.translate("embeds.help.no_description")}`;
            let requiredPermissions = Array.isArray(command.requirements)
                ? command.requirements.filter(x => !x.hideInDescription).map(x => x.name).join(", ")
                : command.requirements?.name;
            
            if (requiredPermissions)
                requiredPermissions = `\n${translator.translate("embeds.help.required_permissions", requiredPermissions)}`;
            else
                requiredPermissions = "";

            embed = {
                title: translator.translate("embeds.help.title"),
                description: (command.func
                    ? codeBlock + description
                    : translator.translate("embeds.help.select_command_in_category"))
                    + requiredPermissions
            };
        }

        return {
            embeds: [embed],
            components: chain.map(x => new ActionRowBuilder<SelectMenuBuilder>()
                .setComponents([x.selectMenu]))
        };
    };

    let resp = await msg.channel.send(makeOptions(null));

    resp.createMessageComponentCollector({
        idle: 60000,
        dispose: true
    }).on("collect", async (interaction: SelectMenuInteraction) => {
        if (interaction.user != msg.author) {
            interaction.reply({
                content: translator.translate("errors.send_your_own_command", getPrefix(msg.guildId), "help"),
                ephemeral: true
            });
            return;
        }

        let pos = levelNameToPosition.get(interaction.customId);
        if (pos < chain.length - 1)
            popFromChain(pos);

        let entry = chain[pos];
        let command = entry.commands.get(interaction.values[0]);
        let subcommands = command.subcommands;
        if (subcommands) {
            let filtered = filterCommands([...subcommands.values()])
            if (filtered.length)
                pushToChain(filtered);
            else
                assert(command.func, `Category without visible subcommands\nCommand: ${command.path}`)
        }

        for (const option of entry.selectMenu.options)
            option.setDefault(option.data.value === interaction.values[0]);

        await interaction.update(makeOptions(command));
    }).on("end", () => {
        resp.edit({
            embeds: resp.embeds,
            components: []
        })
    });
}

const command: Command = {
    name: "help",
    func: help
}
export default command;
