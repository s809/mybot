import { ApplicationCommandOptionType } from "discord.js";
import { client } from "../env";
import { resolveCommand } from "../modules/commands";
import { CommandHandler } from "../modules/commands/definitions";
import { setTimeout } from "timers/promises"
import { CommandMessage } from "../modules/commands/CommandMessage";
import { logError } from "../log";
import sendLongText from "../modules/messages/sendLongText";
import { sanitizePaths } from "../util";

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const path = [
        interaction.command!.name,
        interaction.options.getSubcommandGroup(false),
        interaction.options.getSubcommand(false)
    ].filter(x => x).join('/');

    const command = resolveCommand(path);
    if (!command) {
        await interaction.reply("Unknown command.");
        return;
    }
    if (!command.handler) return;

    const argsObj = {} as Parameters<CommandHandler>["1"];
    const argToGetter = new Map<ApplicationCommandOptionType, (name: string, require?: boolean) => any>([
            [ApplicationCommandOptionType.String, interaction.options.getString],
            [ApplicationCommandOptionType.Number, interaction.options.getNumber],
            [ApplicationCommandOptionType.Boolean, interaction.options.getBoolean],
            [ApplicationCommandOptionType.Channel, interaction.options.getChannel],
            [ApplicationCommandOptionType.User, interaction.options.getUser],
            [ApplicationCommandOptionType.Role, interaction.options.getRole],
    ]);
    
    for (const arg of command.args.list) {
        let getter = argToGetter.get(arg.type);
        if (!getter) {
            // Unsupported argument type
            await interaction.reply({
                content: "Unknown error. (Code: 42)",
                ephemeral: true
            });
            return;
        }

        argsObj[arg.translationKey] = getter.bind(interaction.options)(arg.name)!;
    }

    if (command.args.lastArgAsExtras) {
        const key = command.args.list[command.args.list.length - 1].translationKey;
        argsObj[key] = (argsObj[key] as string).match(/[^"\s]+|"(?:\\"|[^"])+"/g)!.map(str => {
            if (str.match(/^".*"$/))
                str = str.slice(1, -1);

            return str.replace("\\\"", "\"").replace("\\\\", "\\");
        })
    }

    try {
        const commandMessage = new CommandMessage(interaction);
        
        let result: string | undefined;
        try {
            let finished = false;

            const promise = Promise.resolve(command.handler(commandMessage, argsObj)).then((result: any) => {
                finished = true;
                return result;
            });

            result = await Promise.race([
                promise,
                setTimeout(1000)
            ]);

            if (!finished) {
                //await interaction.deferReply({ ephemeral: true });
                result = await promise;
            }
        }
        catch (e) {
            logError(e);
            await sendLongText(commandMessage, sanitizePaths(e.stack));
        }

        if (!interaction.replied) {
            await interaction.reply({
                content: result ?? "Done!",
                ephemeral: true
            })
        }
    } catch (e) {
        logError(e);
    }
});
