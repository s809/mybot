import { CommandInteraction, Guild, GuildMember, If, InteractionDeferReplyOptions, InteractionReplyOptions, InteractionResponse, Message, MessageCollectorOptionsParams, MessageComponentType, MessageEditOptions, TextBasedChannel, WebhookEditMessageOptions, GuildTextBasedChannel, MessageCreateOptions, MessageReplyOptions } from 'discord.js';
import { PrefixedTranslator } from '../misc/Translator';
import { Command } from './definitions';

export class CommandMessage<InGuild extends boolean = boolean> {
    readonly command: Command;
    readonly translator: PrefixedTranslator;
    readonly message?: Message;
    readonly interaction?: CommandInteraction;

    constructor(command: Command, translator: PrefixedTranslator, source: Message | CommandInteraction) {
        this.command = command;
        this.translator = translator;

        if (source instanceof Message)
            this.message = source;
        else
            this.interaction = source;
    }

    async completeSilently() {
        if (this.interaction && !this.interaction.replied) {
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

    async reply(options: string | InteractionReplyOptions | MessageReplyOptions) {
        if (this.interaction) {
            return new CommandResponse({
                interaction: this.interaction,
                response: await this.interaction.reply({
                    ephemeral: true,
                    ...typeof options === "string"
                        ? { content: options }
                        : options
                } as InteractionReplyOptions),
                message: await this.interaction.fetchReply()
            });
        } else {
            return this.sendSeparate(options as MessageReplyOptions);
        }
    }

    async replyOrSendSeparate(options: InteractionReplyOptions | MessageReplyOptions) {
        return this.reply(options)
            .catch(() => this.sendSeparate(options as MessageReplyOptions));
    }

    async sendSeparate(options: string | MessageReplyOptions) {
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
    get channel(): If<InGuild, GuildTextBasedChannel, TextBasedChannel> & {send: never} {
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

    async edit(options: string | MessageCreateOptions | MessageEditOptions | WebhookEditMessageOptions | InteractionReplyOptions) {
        if (this.interaction) {
            if (this.interaction.deferred)
                this.message = await this.interaction.followUp(options as InteractionReplyOptions);
            else
                this.message = await this.interaction.editReply(options as WebhookEditMessageOptions);
        } else {
            if (this.deferChannel) {
                this.message = await this.deferChannel.send(options as MessageCreateOptions);
                this.deferChannel = undefined;
            } else {
                this.message = await this.message!.edit(options as MessageEditOptions);
            }
        }
    }

    async delete() {
        if (this.interaction) {
            if (this.interaction.ephemeral) {
                await this.interaction.editReply({
                    content: this.message!.content,
                    embeds: this.message!.embeds,
                    components: []
                });
            } else {
                await this.interaction.deleteReply();
            }
        } else if (this.message) {
            await this.message.delete().catch(() => { });
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
