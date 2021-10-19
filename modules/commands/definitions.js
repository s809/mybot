/**
 * @file Contains definitions for commands.
 */
/**
 * @typedef {object} Command
 * @property {string} name Name of a command.
 * @property {string?} path Slash-delimited path to command.
 * @property {string?} [description] Description of a command.
 * @property {string?} [args] Representation of command arguments.
 * @property {number?} [minArgs] Minimum number of arguments.
 * @property {number?} [maxArgs] Maximum number of arguments.
 * @property {CommandHandler?} [func] Handler of a command.
 * @property {Map<string, Command>?} [subcommands] Child commands.
 * @property {CommandManagementPermissionLevel?} [managementPermissionLevel] Level of elevation required to manage command permissions.
 * The command is given to users/members in level by default.
 */

/**
 * Elevation level for managing specific command.
 * 
 * @readonly
 * @enum {string | import("discord.js").PermissionResolvable}
 */
export const CommandManagementPermissionLevel = {
    BOT_OWNER: "BOT_OWNER",
    SERVER_OWNER: "SERVER_OWNER"
};

/**
 * @callback CommandHandler
 * @param {import("discord.js").Message} msg Message the command was sent from.
 * @param {...string} args Command arguments.
 * @returns {Promise<boolean>} Whether the execution was successful.
 */
