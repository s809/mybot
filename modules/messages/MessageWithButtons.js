/**
 * @file Wrapper for message with customizable button type.
 */
import { MessageButton, MessageActionRow, Message } from "discord.js";

/**
 * @enum {string}
 */
export const MessageButtonType = {
    REACTION: "REACTION",
    BUTTON: "BUTTON"
};

export default class MessageWithButtons {
    /**
     * Constructs instance.
     * 
     * @param {MessageButtonType} buttonType Type of buttons used.
     * @param {import("discord.js").MessageButtonOptions[]} buttons Array of button templates.
     */
    constructor(buttonType, ...buttons) {
        this.buttonType = buttonType;
        this.buttons = new Map(buttons.map(button => [button.emoji, new MessageButton(button)]));
    }

    /**
     * Sends message and binds instance to it.
     * 
     * @param {import("discord.js").TextBasedChannels} channel Channel to send message.
     * @param {import("discord.js").MessageOptions} options Additional message options.
     * @param {(customId: string) => import("discord.js").Awaited<void>} interactionListener Listener for incoming interactions.
     */
    async send(channel, options, interactionListener) {
        /** @type {Message} */
        this.message = await channel.send(this.addButtons(options));

        if (this.buttonType === MessageButtonType.BUTTON) {
            this.collector = this.message.createMessageComponentCollector({
                idle: 60000
            });

            this.collector.on("collect", async interaction => {
                await interaction.deferUpdate();
                await interactionListener(interaction.customId);
            });

            this.collector.on("end", async () => {
                await this.message.edit({
                    content: this.message.content.length ? this.message.content : undefined,
                    embeds: this.message.embeds.length ? this.message.embeds : undefined,
                    components: []
                });
            });
        }
        else {
            for (let emoji of this.buttons.keys())
                await this.message.react(emoji);

            this.collector = this.message.createReactionCollector({
                filter: reaction => this.buttons.has(reaction.emoji.name),
                idle: 60000
            });

            this.collector.on("collect", async (reaction, user) => {
                await interactionListener(this.buttons.get(reaction.emoji.name).customId);
                await reaction.users.remove(user);
            });

            this.collector.on("end", async () => await this.message.reactions.removeAll());
        }
    }

    /**
     * Updates state of interaction button.
     * 
     * @param {import("discord.js").EmojiIdentifierResolvable} emoji Emoji of a button which state to change.
     * @param {boolean} disabled Whether a button is disabled.
     */
    setButtonDisabled(emoji, disabled) {
        this.buttons.get(emoji).setDisabled(disabled);
    }

    /**
     * Edits bound message with updated button states.
     * 
     * @param {import("discord.js").MessageEditOptions} options Additional options for editing a message.
     */
    async edit(options) {
        this.message = await this.message.edit(this.addButtons(options));
    }

    /**
     * Stops collection of interactions on bound message.
     */
    stopCollectingInteractions() {
        this.collector.stop();
    }

    /**
     * Adds buttons to options if need.
     * 
     * @private
     * @param {import("discord.js").MessageOptions | import("discord.js").MessageEditOptions} options Options for sending/editing a message.
     * @returns {import("discord.js").MessageOptions | import("discord.js").MessageEditOptions} Options with added components.
     */
    addButtons(options) {
        if (this.buttonType === MessageButtonType.REACTION) return options;

        return {
            ...options,
            components: [
                new MessageActionRow().addComponents(...this.buttons.values()),
                ...options?.components ?? []
            ]
        };
    }
}
