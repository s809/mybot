import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "invitetracker",
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite,
    allowDMs: false,
    usableAsAppCommand: true,
    subcommands: await importCommands(import.meta.url),
};
export default command;
