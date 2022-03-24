import { Message, MessageActionRow, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import { getRootCommands } from "../modules/commands/commands.js";
import { CommandManagementPermissionLevel } from "../modules/commands/definitions.js";
import { getPrefix } from "../modules/commands/getPrefix.js";
import { isCommandAllowedToUse } from "../modules/commands/permissions.js";
import { Translator } from "../modules/misc/Translator.js";
/** @typedef {import("../modules/commands/definitions.js").Command} Command */
/** @typedef {import("discord.js").MessageSelectOption} MessageSelectOption */

/**
 * @param {Message} msg
 */
async function help(msg) {
    let translator = Translator.get(msg);

    /**
     * @param {Command[]} list 
     * @returns
     */
    const filterCommands = list => list.filter(command => {
        if (command.managementPermissionLevel === CommandManagementPermissionLevel.BOT_OWNER &&
            !msg.channel.recipient)
            return false;
        return isCommandAllowedToUse(msg, command);
    });

    /** @type {Map<string, number>} */
    let levelNameToPosition = new Map();
    /**
     * @type {{
     *  row: MessageActionRow;
     *  selectMenu: MessageSelectMenu;
     *  commands: Map<string, Command>;
     *  selectOptions: MessageSelectOption[];
     * }[]}
     */
    let chain = [];

    /**
     * @param {Command[]} commands 
     */
    let pushToChain = commands => {
        const levelName = `level${chain.length}`;

        /** @type {MessageSelectOption[]} */
        let selectOptions = commands.map(x => ({
            label: x.name,
            value: `${levelName}_${x.name}`,
            default: false
        }));

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
            selectOptions: selectOptions
        });
    };
    let popFromChain = toPos => {
        for (let [key, value] of levelNameToPosition) {
            if (value > toPos)
                levelNameToPosition.delete(key);
        }
        chain.splice(toPos + 1);
    };
    pushToChain(filterCommands(getRootCommands()));

    /**
     * @param {Command} command
     * @returns
     */
    const makeOptions = command => {
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
                    ? `\`\`\`\n${getPrefix(msg.guildId)}${command.path.replace("/", " ")} ${command.args ?? ""}\`\`\`\n` +
                    `${translator.translate("commandDescriptions." + command.path.replace("/", "_")) ?? translator.translate("embeds.help.no_description")}`
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
    }).on("collect", /** @param {SelectMenuInteraction} interaction */ async interaction => {
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
            return option;
        }));

        await resp.edit(makeOptions(command));
    }).on("end", () => resp.edit({
        embeds: resp.embeds,
        components: []
    }));
}

export const name = "help";
export const func = help;
