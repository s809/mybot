import { CommandRequirement } from ".";

export const InServer: CommandRequirement = {
    name: "In Server",
    check: msg => msg.guildId !== null,
    failureMessage: "You must be in a server to use this command.",
    hideInDescription: true,
    hideCommand: true
};
