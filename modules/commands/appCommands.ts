import { ChatInputApplicationCommandData, ApplicationCommandType, CommandInteraction, Guild, GuildMember, If, InteractionDeferReplyOptions, InteractionReplyOptions, InteractionResponse, MappedInteractionTypes, Message, MessageCollectorOptionsParams, MessageComponentType, MessageEditOptions, MessageOptions, ReplyMessageOptions, TextBasedChannel, WebhookEditMessageOptions, ApplicationCommandOptionType, ApplicationCommandSubGroupData, LocaleString, ApplicationCommandData } from 'discord.js';
import { iterateCommands } from '.';
import { client } from '../../env';
import { Translator } from '../misc/Translator';

export async function refreshCommands() {
    const commands: ChatInputApplicationCommandData[] = [];

    for (const command of iterateCommands()) {
        if (!command.usableAsAppCommand)
            continue;

        if (command.args.max > 0 && command.subcommands.size)
            throw new Error("Command cannot have both arguments and subcommands.");

        const data: ChatInputApplicationCommandData & {
            options: typeof command.args.list
        } = {
            name: command.nameTranslations[Translator.fallbackLocale],
            description: command.descriptionTranslations[Translator.fallbackLocale],
            nameLocalizations: command.nameTranslations,
            descriptionLocalizations: command.descriptionTranslations,
            options: command.args.list
        }
        
        const pathParts = command.path.split('/');
        switch (pathParts.length) {
            case 1:
                commands.push({
                    ...data,
                    type: ApplicationCommandType.ChatInput,
                });
                break;
            case 2:
                const c = commands.find(c => c.name === pathParts[0])!;
                c.options ??= [];
                c.options.push({
                    ...data,
                    type: ApplicationCommandOptionType.Subcommand,
                });
                break;
            case 3:
                const cc = commands.find(c => c.name === pathParts[0])!;
                const s = cc.options!.find(s => s.name === pathParts[1])! as ApplicationCommandSubGroupData;
                s.type = ApplicationCommandOptionType.SubcommandGroup;
                s.options ??= [];
                s.options.push({
                    ...data,
                    type: ApplicationCommandOptionType.Subcommand,
                });
                break;
            default:
                throw new Error(`Invalid command path: ${command.path}`);
        }
    }

    debugger;
    await client.application?.commands.set(commands);
}

export class CommandMessage<InGuild extends boolean = boolean> {
    readonly message?: Message;
    readonly interaction?: CommandInteraction;

    constructor(source: Message | CommandInteraction) {
        if (source instanceof Message)
            this.message = source;
        else
            this.interaction = source;
    }

    async ignore() {
        if (this.interaction) {
            await this.interaction.deferReply();
            await this.interaction.deleteReply();
        }
    }

    async deferReply(options: InteractionDeferReplyOptions = {}) {
        if (this.interaction) {
            return new CommandResponse({
                interaction: this.interaction,
                response: await this.interaction!.deferReply({ ephemeral: true, ...options })
            });
        } else {
            return new CommandResponse({
                deferChannel: this.message!.channel,
            });
        }
    }

    async reply(options: string | InteractionReplyOptions | ReplyMessageOptions) {
        if (this.interaction) {
            return new CommandResponse({
                interaction: this.interaction,
                response: await this.interaction.reply({ ephemeral: true, options } as InteractionReplyOptions)
            });
        } else {
            return this.sendSeparate(options as ReplyMessageOptions);
        }
    }

    async replyOrSendSeparate(options: InteractionReplyOptions | ReplyMessageOptions) {
        try {
            return this.reply(options);
        } catch (e) {
            return this.sendSeparate(options as ReplyMessageOptions);
        }
    }

    async sendSeparate(options: string | ReplyMessageOptions) {
        return new CommandResponse({
            message: await (this.interaction?.channel ?? this.message!.channel).send(options)
        });
    }

    get content() {
        return this.message?.content ?? "";
    }

    inGuild(): this is CommandMessage<true> {
        return this.interaction?.inGuild() ?? this.message!.inGuild();
    }

    // {send: never} is to avoid breaking interaction-ish flow
    get channel(): TextBasedChannel & {send: never} {
        return this.interaction?.channel ?? this.message!.channel as any;
    }

    get channelId() {
        return this.interaction?.channelId ?? this.message!.channelId;
    }

    get guild(): If<InGuild, Guild, null> {
        return this.interaction?.guild ?? this.message?.guild ?? null as any;
    }

    get guildId(): If<InGuild, string, null> {
        return this.interaction?.guildId ?? this.message?.guildId ?? null as any;
    }

    get member(): If<InGuild, GuildMember, null> {
        return this.interaction?.member ?? this.message?.member ?? null as any;
    }

    get author() {
        return this.interaction?.user ?? this.message!.author;
    }
}

export class CommandResponse {
    readonly interaction?: CommandInteraction;
    private deferChannel?: TextBasedChannel;
    readonly response?: InteractionResponse;

    private message?: Message;

    constructor({
        message,
        interaction,
        response,
        deferChannel,
    }: {
        message?: Message;
        interaction?: CommandInteraction;
        response?: InteractionResponse;
        deferChannel?: TextBasedChannel;
    }) {
        this.message = message;
        this.interaction = interaction;
        this.response = response;
        this.deferChannel = deferChannel;
    }

    async edit(options: string | MessageOptions | MessageEditOptions | WebhookEditMessageOptions | InteractionReplyOptions) {
        if (this.interaction) {
            if (this.interaction.deferred)
                this.message = await this.interaction.followUp(options as InteractionReplyOptions);
            else
                this.message = await this.interaction.editReply(options as WebhookEditMessageOptions);
        } else {
            if (this.deferChannel) {
                this.message = await this.deferChannel.send(options as MessageOptions);
                this.deferChannel = undefined;
            } else {
                this.message = await this.message!.edit(options as MessageEditOptions);
            }
        }
    }

    createMessageComponentCollector<T extends MessageComponentType>(
        options?: MessageCollectorOptionsParams<T>,
    ) {
        const source = this.response ?? this.message!;
        return source.createMessageComponentCollector(options);
    }

    get content() {
        return this.message?.content;
    }

    get embeds() {
        return this.message?.embeds;
    }
}
