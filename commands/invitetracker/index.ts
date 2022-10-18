import { PermissionFlagsBits } from "discord.js";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";

const command: CommandDefinition = {
    key: "invitetracker",
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite,
    allowDMs: false,
    usableAsAppCommand: true,
    subcommands: await importModules(import.meta.url),
};
export default command;
