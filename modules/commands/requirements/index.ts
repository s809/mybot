import { Message } from "discord.js";
import { data } from "../../../env";
import { Command } from "../definitions";

export interface CommandRequirement {
    name: string;
    check: (msg: Message) => boolean;
    failureMessage?: string;
    hideInDescription?: boolean;
    hideCommand?: boolean | ((msg: Message) => boolean);
    satisfiedBy?: CommandRequirement | CommandRequirement[];
    requires?: CommandRequirement | CommandRequirement[];
    overridable?: boolean;
}

/**
 * Checks a provided command requirement against a message.
 * 
 * `allowed` is true if the requirement is (at least one of):
 * - overridable and {@link override} is true
 * - satisfied with and its subrequirements are satisfied
 * - satisfied by any of alternatives
 */
function checkRequirement(
    msg: Message,
    requirements: CommandRequirement,
    override: boolean = false
): {
    allowed: boolean;
    message?: string;
    hideCommand: boolean;
} {
    const forceHide = typeof requirements.hideCommand === "function" && requirements.hideCommand(msg);
    const hideOnFailure = typeof requirements.hideCommand === "boolean" && requirements.hideCommand
        || forceHide;

    if (requirements.overridable && override) {
        return {
            allowed: true,
            hideCommand: forceHide
        };
    }

    if (requirements.requires) {
        const requires = Array.isArray(requirements.requires)
            ? requirements.requires
            : [requirements.requires];
        const result = checkRequirements(msg, requires, override);
        if (!result.allowed) return {
            allowed: false,
            message: result.message,
            hideCommand: hideOnFailure
        };
    }

    const allowed = requirements.check(msg);
    if (allowed) {
        return {
            allowed,
            hideCommand: forceHide
        };
    }

    if (requirements.satisfiedBy) {
        const satisfiedBy = Array.isArray(requirements.satisfiedBy)
            ? requirements.satisfiedBy
            : [requirements.satisfiedBy];
        const result = satisfiedBy.some(r => checkRequirement(msg, r, override).allowed);
        if (result) {
            return {
                allowed,
                hideCommand: forceHide
            };
        }
    }

    return {
        allowed,
        message: requirements.failureMessage,
        hideCommand: hideOnFailure
    };
}

/**
 * Checks a list of requirements against a message.
 * 
 * `allowed` is true if all requirements are satisfied. \
 * `message` is the message of the first failed requirement if all failed requirements have messages, otherwise undefined. \
 * `hideCommand` is true if any requirement has {@link CommandRequirement.hideCommand hideCommand} set to true.
 * 
 * @see checkRequirement
 */
export function checkRequirements(
    msg: Message,
    requirements: CommandRequirement[],
    override: boolean = false
): {
    allowed: boolean;
    message?: string;
    hideCommand: boolean;
} {
    const results = requirements.map(requirement => checkRequirement(msg, requirement, override));
    const failures = results.filter(result => !result.allowed);
    return {
        allowed: failures.length === 0,
        message: failures.every(result => result.message)
            ? failures[0]?.message
            : undefined,
        hideCommand: results.some(result => result.hideCommand)
    }
}

/**
 * Checks if a command was overridden to allow it to be used in a specific context.
 * Checked override levels:
 * - global user
 * - guild role
 * - guild member
 */
export function isCommandOverridden(msg: Message, command: Command): boolean {
    const allowedCommands = [
        // Global user
        ...data.users[msg.author.id].allowedCommands,
        ...(msg.inGuild()
            ? [
                // Server roles
                ...msg.member!.roles.cache.map(role => data.guilds[msg.guildId].roles[role.id].allowedCommands).flat(),
                // Server member
                ...data.guilds[msg.guildId].members[msg.author.id].allowedCommands
            ]
            : [])
    ];

    return allowedCommands.some(path => command.path!.startsWith(path));
}

/**
 * Checks if requirements are satisfied to manage command in their context.
 * Requires the command not to be overridden.
 *
 * @param msg Context message.
 * @param command Command to check.
 * @returns Whether the execution of command is allowed.
 */
export function isCommandAllowedToManage(msg: Message, command: Command): boolean {
    if (!command.requirements) return false;

    const requirements = Array.isArray(command.requirements)
        ? command.requirements
        : [command.requirements]
    return checkRequirements(msg, requirements).allowed && !isCommandOverridden(msg, command);
}

/**
 * Checks if user has required permissions to execute command in their context.
 * Takes into account command overrides.
 *
 * @param msg Context message.
 * @param command Command to check.
 * @returns Whether the management of command is allowed.
 */
export function checkRequirementsBeforeRunning(msg: Message, command: Command): ReturnType<typeof checkRequirements> {
    if (!command.requirements) return {
        allowed: true,
        hideCommand: false
    };

    const requirements = Array.isArray(command.requirements)
        ? command.requirements
        : [command.requirements]
    return checkRequirements(msg, requirements, isCommandOverridden(msg, command));
}

export { BotOwner } from "./BotOwner";
export { InServer } from "./InServer";
export { ServerOwner } from "./ServerOwner";
export { ServerPermissions } from "./ServerPermissions";
export { InVoiceChannel } from "./InVoiceChannel";
export { InVoiceWithBot } from "./InVoiceWithBot";
