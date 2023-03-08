import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Guild } from "../database/models";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";

async function prefix(msg: CommandRequest<true>, {
    newPrefix
}: {
    newPrefix: string;
}) {
    await Guild.updateByIdWithUpsert(msg.guildId, { prefix: newPrefix });
}

export default defineCommand({
    key: "prefix",
    args: [{
        key: "newPrefix",
        type: ApplicationCommandOptionType.String,
    }],
    handler: prefix,
    alwaysReactOnSuccess: true,
    interactionCommand: true,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    allowDMs: false
});
