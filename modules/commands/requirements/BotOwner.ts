import { CommandInteraction, DMChannel, Message } from "discord.js";
import { CommandRequirement } from ".";
import { isBotOwner } from "../../../env";

export const BotOwner: CommandRequirement = {
    name: "Bot Owner",
    check: msg => isBotOwner(msg.author),
    hideCommand: msg => !(msg.channel instanceof DMChannel),
    overridable: true
};
