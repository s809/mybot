import { DMChannel, Message, MessageActionRow, MessageSelectMenu, MessageSelectOption, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import { getRootCommands } from "../modules/commands";
import { Command } from "../modules/commands/definitions";
import { isCommandAllowedToUse } from "../modules/commands/permissions";
import { getPrefix } from "../modules/data/getPrefix";
import { Translator } from "../modules/misc/Translator";

async function help(msg: Message) {
    let translator = Translator.get(msg);

    const filterCommands = (list: Command[]) => list.filter(command => {
        if (command.managementPermissionLevel === "BOT_OWNER" &&
            !(msg.channel instanceof DMChannel))
            return false;
        return isCommandAllowedToUse(msg, command);
    });

    let levelNameToPosition: Map<string, number> = new Map();
    let chain: {
        row: MessageActionRow;
        selectMenu: MessageSelectMenu;
        commands: Map<string, Command>;
        selectOptions: MessageSelectOption[];
    }[] = [];

    let pushToChain = (commands: Command[]) => {
        const levelName = `level${chain.length}`;

        let selectOptions = commands.map(x => ({
            label: x.name,
            value: `${levelName}_${x.name}`,
            default: false,
        } as MessageSelectOptionData));

        let selectMenu = new MessageSelectMenu({
            customId: levelName,
            placeholder: translator.translate("embeds.help.select_command_menu"),
            options: selectOptions
        });

        let row = new MessageActionRow({
            components: [selectMenu]
        });

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

    const makeOptions = (command: Command = null) => {
        let embed;

        if (!command) {
            embed = {
                title: translator.translate("embeds.help.title"),
                description: `${translator.translate("embeds.help.select_command")}`
            };
        } else {
            embed = {
                title: translator.translate("embeds.help.title"),
                description: command.func
                    ? `\`\`\`\n${getPrefix(msg.guildId)}${command.path.replace("/", " ")} ${command.args?.[2] ?? ""}\`\`\`\n` +
                    `${translator.tryTranslate("command_descriptions." + command.path.replace("/", "_")) ?? translator.translate("embeds.help.no_description")}`
                    : `${translator.translate("embeds.help.select_command_in_category")}`
            };
        }

        return ({
            embeds: [embed],
            components: chain.map(x => x.row)
        });
    };

    let resp = await msg.channel.send(makeOptions());

    resp.createMessageComponentCollector({
        idle: 60000,
        dispose: true
    }).on("collect", async (interaction: SelectMenuInteraction) => {
        await interaction.deferUpdate();

        let pos = levelNameToPosition.get(interaction.customId);
        if (pos < chain.length - 1)
            popFromChain(pos);

        let entry = chain[pos];
        let command = entry.commands.get(interaction.values[0]);
        let subcommands = command.subcommands;
        if (subcommands)
            pushToChain(filterCommands([...subcommands.values()]));

        entry.selectMenu.setOptions(entry.selectMenu.options.map(option => {
            option.default = option.value === interaction.values[0];
            return option as MessageSelectOptionData;
        }));

        await resp.edit(makeOptions(command));
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
