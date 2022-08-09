import { BotOwner, CommandRequirement, InServer } from ".";

export const ServerOwner: CommandRequirement = {
    name: "Server Owner",
    check: msg => msg.guild.ownerId === msg.author.id,
    hideCommand: true,
    satisfiedBy: [BotOwner],
    requires: [InServer],
    overridable: true
};
