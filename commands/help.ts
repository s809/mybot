import { assert } from "console";
import { BitFieldResolvable, DMChannel, Message, MessageActionRow, MessageSelectMenu, MessageSelectOption, MessageSelectOptionData, Permissions, PermissionString, SelectMenuInteraction } from "discord.js";
import { getRootCommands, toUsageString } from "../modules/commands";
import { Command, CommandManagementPermissionLevel } from "../modules/commands/definitions";
import { isCommandAllowedToUse } from "../modules/commands/permissions";
import { getPrefix } from "../modules/data/getPrefix";
import { Translator } from "../modules/misc/Translator";
import { capitalizeWords } from "../util";

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
            const convertPermissions = (raw: CommandManagementPermissionLevel): string => {
                if (typeof raw === "bigint")
                    raw = raw.toString() as CommandManagementPermissionLevel;

                if (typeof raw === "string") {
                    if (raw.match(/^\d+$/))
                        return convertPermissions(new Permissions(raw as BitFieldResolvable<PermissionString, bigint>));
                    else
                        return capitalizeWords(raw.replaceAll("_", " "));
                }

                if (raw instanceof Permissions)
                    return convertPermissions(raw.toArray())
                
                if (Array.isArray(raw))
                    return raw.map(p => convertPermissions(p)).join(", ");

                assert(false, "Permission conversion failed\nValue: %s", raw);
            };

            let codeBlock = `\`\`\`\n${toUsageString(msg, command)}\`\`\`\n`;
            let description = `${translator.tryTranslate("command_descriptions." + command.path.replaceAll("/", "_")) ?? translator.translate("embeds.help.no_description")}`;
            let requiredPermissions = command.managementPermissionLevel
                ? `\n${translator.translate("embeds.help.required_permissions", convertPermissions(command.managementPermissionLevel))}`
                : ""

            embed = {
                title: translator.translate("embeds.help.title"),
                description: (command.func
                    ? codeBlock + description
                    : translator.translate("embeds.help.select_command_in_category"))
                    + requiredPermissions
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
        if (subcommands)
            pushToChain(filterCommands([...subcommands.values()]));

        entry.selectMenu.setOptions(entry.selectMenu.options.map(option => {
            option.default = option.value === interaction.values[0];
            return option as MessageSelectOptionData;
        }));

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
